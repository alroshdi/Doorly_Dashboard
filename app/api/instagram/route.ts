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

async function getAccessToken(): Promise<string> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    throw new Error("INSTAGRAM_ACCESS_TOKEN environment variable is not set");
  }
  return token;
}

async function fetchMediaList(accessToken: string): Promise<MediaItem[]> {
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
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(`Failed to fetch media list: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      allMedia.push(...data.data);
    }

    // Check for next page
    nextUrl = data.paging?.next || null;
  }

  return allMedia;
}

async function fetchMediaInsights(
  mediaId: string,
  mediaType: string,
  accessToken: string
): Promise<{
  impressions?: number;
  reach?: number;
  engagement?: number;
  saved?: number;
  plays?: number;
  total_interactions?: number;
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
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    console.error(`Failed to fetch insights for ${mediaId}:`, error);
    return {};
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

  return insights;
}

async function getInstagramData() {
  try {
    const accessToken = await getAccessToken();
    
    // Fetch media list
    const mediaList = await fetchMediaList(accessToken);
    
    // Fetch insights for each media item
    const postsWithInsights = await Promise.all(
      mediaList.map(async (media) => {
        try {
          const insights = await fetchMediaInsights(media.id, media.media_type, accessToken);
          
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

    return {
      posts: postsWithInsights,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error fetching Instagram data:", error);
    throw error;
  }
}

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const data = await getInstagramData();
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in Instagram API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Instagram data" },
      { status: 500 }
    );
  }
}
