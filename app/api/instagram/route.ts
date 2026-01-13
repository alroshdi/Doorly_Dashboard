import { NextResponse } from "next/server";

const INSTAGRAM_BUSINESS_ID = "17841451550237400";
const INSTAGRAM_GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface MediaItem {
  id: string;
  caption?: string;
  media_type: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface InsightValue {
  value: number;
}

interface InsightsResponse {
  data: Array<{
    name: string;
    values: InsightValue[];
    title: string;
    description: string;
  }>;
}

interface TokenError {
  code: string;
  message: string;
  isExpired: boolean;
  isMissing: boolean;
}

function getAccessToken(): { token: string; error: null } | { token: null; error: TokenError } {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token || token.trim() === "") {
    return {
      token: null,
      error: {
        code: "MISSING_TOKEN",
        message: "INSTAGRAM_ACCESS_TOKEN environment variable is not set",
        isExpired: false,
        isMissing: true,
      },
    };
  }
  return { token, error: null };
}

function parseMetaAPIError(error: any): TokenError | null {
  if (!error || typeof error !== "object") return null;

  // Check for Meta API error structure
  const errorData = error.error || error;
  const errorCode = errorData.code || errorData.error_code || errorData.error_subcode;
  const errorMessage = errorData.message || errorData.error_user_msg || errorData.error_user_title || "";

  // Meta API error codes:
  // 190: Invalid OAuth 2.0 Access Token
  // 463: Expired access token
  // 10: Permission denied
  // 200: Requires extended permission
  
  if (errorCode === 190 || errorCode === 463) {
    return {
      code: `META_${errorCode}`,
      message: errorMessage || (errorCode === 190 ? "Invalid OAuth 2.0 Access Token" : "Access token has expired"),
      isExpired: true,
      isMissing: false,
    };
  }

  if (errorCode === 10) {
    return {
      code: "META_PERMISSION_DENIED",
      message: errorMessage || "Permission denied. Please check your token permissions.",
      isExpired: false,
      isMissing: false,
    };
  }

  return null;
}

async function fetchMediaList(accessToken: string): Promise<{ data: MediaItem[]; error: null } | { data: null; error: TokenError }> {
  const url = `${INSTAGRAM_GRAPH_API_BASE}/${INSTAGRAM_BUSINESS_ID}/media`;
  const params = new URLSearchParams({
    fields: "id,caption,media_type,timestamp,like_count,comments_count",
    access_token: accessToken,
    limit: "100", // Maximum allowed per request
  });

  const allMedia: MediaItem[] = [];
  let nextUrl: string | null = `${url}?${params}`;

  // Handle pagination
  while (nextUrl) {
    const response: Response = await fetch(nextUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      
      // Check for Meta API specific errors
      const metaError = parseMetaAPIError(errorData);
      if (metaError) {
        console.error(`[Instagram API] Meta API Error ${metaError.code}: ${metaError.message}`);
        return { data: null, error: metaError };
      }
      
      console.error(`[Instagram API] Failed to fetch media list:`, errorData);
      throw new Error(`Failed to fetch media list: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Check for errors in response
    if (data.error) {
      const metaError = parseMetaAPIError(data);
      if (metaError) {
        console.error(`[Instagram API] Meta API Error ${metaError.code}: ${metaError.message}`);
        return { data: null, error: metaError };
      }
    }
    
    if (data.data && Array.isArray(data.data)) {
      allMedia.push(...data.data);
    }

    // Check for next page
    nextUrl = data.paging?.next || null;
  }

  return { data: allMedia, error: null };
}

async function fetchMediaInsights(
  mediaId: string,
  mediaType: string,
  accessToken: string
): Promise<{
  insights: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    saved?: number;
    plays?: number;
    total_interactions?: number;
  };
  error: TokenError | null;
}> {
  let metrics: string;
  
  if (mediaType === "IMAGE" || mediaType === "CAROUSEL_ALBUM") {
    metrics = "impressions,reach,engagement,saved";
  } else if (mediaType === "VIDEO") {
    metrics = "impressions,reach,plays,total_interactions";
  } else {
    // Default for other types
    metrics = "impressions,reach,engagement";
  }

  const url = `${INSTAGRAM_GRAPH_API_BASE}/${mediaId}/insights`;
  const params = new URLSearchParams({
    metric: metrics,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    
    // Check for Meta API specific errors
    const metaError = parseMetaAPIError(errorData);
    if (metaError) {
      console.error(`[Instagram API] Meta API Error ${metaError.code} for media ${mediaId}: ${metaError.message}`);
      return { insights: {}, error: metaError };
    }
    
    console.error(`[Instagram API] Failed to fetch insights for ${mediaId}:`, errorData);
    return { insights: {}, error: null };
  }

  const insightsData: InsightsResponse = await response.json();
  const insights: any = {};

  // Parse insights response
  if (insightsData.data) {
    insightsData.data.forEach((item) => {
      const value = item.values?.[0]?.value || 0;
      insights[item.name] = value;
    });
  }

  return { insights, error: null };
}

async function getInstagramData() {
  try {
    // Check token first
    const tokenResult = getAccessToken();
    if (tokenResult.error) {
      console.error(`[Instagram API] ${tokenResult.error.code}: ${tokenResult.error.message}`);
      return {
        posts: [],
        timestamp: new Date().toISOString(),
        error: tokenResult.error,
      };
    }

    const accessToken = tokenResult.token;
    
    // Fetch media list
    const mediaListResult = await fetchMediaList(accessToken);
    if (mediaListResult.error) {
      console.error(`[Instagram API] ${mediaListResult.error.code}: ${mediaListResult.error.message}`);
      return {
        posts: [],
        timestamp: new Date().toISOString(),
        error: mediaListResult.error,
      };
    }

    const mediaList = mediaListResult.data;
    let hasTokenError = false;
    let tokenError: TokenError | null = null;
    
    // Fetch insights for each media item
    const postsWithInsights = await Promise.all(
      mediaList.map(async (media) => {
        try {
          const insightsResult = await fetchMediaInsights(media.id, media.media_type, accessToken);
          
          // Check for token errors in insights
          if (insightsResult.error) {
            if (!hasTokenError) {
              hasTokenError = true;
              tokenError = insightsResult.error;
            }
            // Return default values if token error
            return {
              id: media.id,
              type: media.media_type,
              caption: media.caption || "",
              reach: 0,
              impressions: 0,
              saved: 0,
              engagement: 0,
              engagementRate: 0,
              timestamp: media.timestamp,
              likes: media.like_count || 0,
              comments: media.comments_count || 0,
            };
          }
          
          const insights = insightsResult.insights;
          
          // Map API response to our data structure
          const reach = insights.reach || 0;
          const impressions = insights.impressions || 0;
          const saved = insights.saved || 0;
          
          // For engagement, use the appropriate field based on media type
          let engagement = 0;
          if (media.media_type === "VIDEO") {
            engagement = insights.total_interactions || 0;
          } else {
            engagement = insights.engagement || 0;
          }
          
          // Calculate engagement rate
          const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;
          
          // Get likes and comments from media item
          const likes = media.like_count || 0;
          const comments = media.comments_count || 0;
          
          return {
            id: media.id,
            type: media.media_type,
            caption: media.caption || "",
            reach: reach,
            impressions: impressions,
            saved: saved,
            engagement: engagement,
            engagementRate: engagementRate,
            timestamp: media.timestamp,
            likes: likes,
            comments: comments,
          };
        } catch (error: any) {
          console.error(`Error fetching insights for media ${media.id}:`, error);
          // Return media with default values if insights fail
          return {
            id: media.id,
            type: media.media_type,
            caption: media.caption || "",
            reach: 0,
            impressions: 0,
            saved: 0,
            engagement: 0,
            engagementRate: 0,
            timestamp: media.timestamp,
            likes: media.like_count || 0,
            comments: media.comments_count || 0,
          };
        }
      })
    );

    // If we encountered a token error during insights fetching, return error
    if (hasTokenError && tokenError) {
      return {
        posts: [],
        timestamp: new Date().toISOString(),
        error: tokenError,
      };
    }

    return {
      posts: postsWithInsights,
      timestamp: new Date().toISOString(),
      error: null,
    };
  } catch (error: any) {
    console.error("[Instagram API] Unexpected error:", error);
    
    // Try to parse as Meta API error
    const metaError = parseMetaAPIError(error);
    if (metaError) {
      return {
        posts: [],
        timestamp: new Date().toISOString(),
        error: metaError,
      };
    }
    
    // Generic error
    return {
      posts: [],
      timestamp: new Date().toISOString(),
      error: {
        code: "UNKNOWN_ERROR",
        message: error.message || "Failed to fetch Instagram data",
        isExpired: false,
        isMissing: false,
      },
    };
  }
}

export async function GET() {
  try {
    // Check cache (but not for errors)
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION && !cache.data.error) {
      return NextResponse.json(cache.data);
    }

    const data = await getInstagramData();
    
    // Only cache successful responses
    if (!data.error) {
      cache = {
        data,
        timestamp: Date.now(),
      };
    } else {
      // Clear cache on error
      cache = null;
    }

    // Return appropriate status code based on error type
    if (data.error) {
      const statusCode = data.error.isMissing || data.error.isExpired ? 401 : 500;
      return NextResponse.json(data, { status: statusCode });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Instagram API] Unexpected error in GET handler:", error);
    return NextResponse.json(
      { 
        posts: [],
        timestamp: new Date().toISOString(),
        error: {
          code: "UNEXPECTED_ERROR",
          message: error.message || "Failed to fetch Instagram data",
          isExpired: false,
          isMissing: false,
        }
      },
      { status: 500 }
    );
  }
}
