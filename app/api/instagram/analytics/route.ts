import { NextResponse } from "next/server";
import { google } from "googleapis";

let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface InstagramPost {
  media_id: string;
  timestamp?: string;
  reach?: number;
  impressions?: number;
  total_interactions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  video_views?: number;
  media_type?: string;
  permalink?: string;
  caption?: string;
  // Account-level fields
  followers_count?: number;
  new_followers?: number;
  profile_visits?: number;
  website_clicks?: number;
  // Stories fields
  story_views?: number;
  story_replies?: number;
  exits?: number;
}

interface AvailableFields {
  // Account-level
  followers_count: boolean;
  new_followers: boolean;
  reach: boolean;
  impressions: boolean;
  profile_visits: boolean;
  website_clicks: boolean;
  // Post-level
  media_id: boolean;
  publish_date: boolean;
  media_type: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  saves: boolean;
  video_views: boolean;
  caption: boolean;
  permalink: boolean;
  // Stories
  story_views: boolean;
  story_replies: boolean;
  exits: boolean;
}

interface InstagramAnalyticsResponse {
  posts: InstagramPost[];
  availableFields: AvailableFields;
  kpis: {
    totalReach?: number;
    totalImpressions?: number;
    totalInteractions?: number;
    totalLikes?: number;
    totalComments?: number;
    totalShares?: number;
    totalSaves?: number;
    totalVideoViews?: number;
    totalPosts: number;
    // Account-level
    followersCount?: number;
    newFollowers?: number;
    profileVisits?: number;
    websiteClicks?: number;
    // Stories
    totalStoryViews?: number;
    totalStoryReplies?: number;
    totalExits?: number;
  };
  topPosts: {
    byReach?: InstagramPost[];
    byImpressions?: InstagramPost[];
    byInteractions?: InstagramPost[];
    byLikes?: InstagramPost[];
    byVideoViews?: InstagramPost[];
  };
  timeTrends: {
    last7Days: Array<{
      date: string;
      reach?: number;
      impressions?: number;
      interactions?: number;
      likes?: number;
      comments?: number;
    }>;
  };
  timestamp: string;
  error?: string | null;
}

async function getGoogleSheetsData() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID;
    const sheetName = process.env.SHEET_NAME || "insta_insights_daily";
    const range = `${sheetName}!A:ZZ`; // Expanded range

    if (!serviceAccountEmail || !serviceAccountKey || !sheetId) {
      throw new Error("Missing Google Sheets credentials");
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });
    } catch (apiError: any) {
      if (apiError.code === 404 || apiError.message?.includes("not found")) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }
      if (apiError.code === 403 || apiError.message?.includes("permission")) {
        throw new Error("Permission denied");
      }
      throw apiError;
    }

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { data: [], headers: [] };
    }
    
    if (rows.length === 1) {
      return { data: [], headers: rows[0] };
    }

    const headers = rows[0].map((h: string) => 
      String(h || "").trim().toLowerCase().replace(/\s+/g, "_")
    );
    
    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        const cellValue = row[index];
        obj[header] = cellValue !== undefined ? cellValue : "";
      });
      return obj;
    });

    return { data, headers };
  } catch (error: any) {
    console.error("Error fetching Google Sheets data:", error);
    throw error;
  }
}

function normalizeKey(key: string): string {
  return String(key || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function findField(obj: any, possibleKeys: string[]): { key: string | null; value: any } {
  if (!obj || typeof obj !== "object") return { key: null, value: null };
  
  for (const key of possibleKeys) {
    const normalizedKey = normalizeKey(key);
    const found = Object.keys(obj).find(k => normalizeKey(k) === normalizedKey);
    if (found) {
      const value = obj[found];
      // Return null for empty values, not 0 or ""
      if (value === null || value === undefined || value === "") {
        return { key: found, value: null };
      }
      return { key: found, value };
    }
  }
  
  return { key: null, value: null };
}

function extractNumberValue(obj: any, possibleKeys: string[]): number | null {
  const { value } = findField(obj, possibleKeys);
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return null;
}

function extractStringValue(obj: any, possibleKeys: string[]): string | null {
  const { value } = findField(obj, possibleKeys);
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim();
  if (str && str !== "null" && str !== "undefined") return str;
  return null;
}

function detectAvailableFields(data: any[]): AvailableFields {
  if (!data || data.length === 0) {
    return {
      followers_count: false,
      new_followers: false,
      reach: false,
      impressions: false,
      profile_visits: false,
      website_clicks: false,
      media_id: false,
      publish_date: false,
      media_type: false,
      likes: false,
      comments: false,
      shares: false,
      saves: false,
      video_views: false,
      caption: false,
      permalink: false,
      story_views: false,
      story_replies: false,
      exits: false,
    };
  }

  // Check if fields exist and have at least one non-null value
  const checkField = (possibleKeys: string[]): boolean => {
    return data.some(row => {
      const { value } = findField(row, possibleKeys);
      return value !== null && value !== undefined && value !== "";
    });
  };

  return {
    // Account-level
    followers_count: checkField(["followers_count", "followers", "follower_count"]),
    new_followers: checkField(["new_followers", "new_follower", "followers_gained"]),
    reach: checkField(["reach", "reach_count"]),
    impressions: checkField(["impressions", "impression", "impression_count"]),
    profile_visits: checkField(["profile_visits", "profile_visit", "profile_views"]),
    website_clicks: checkField(["website_clicks", "website_click", "link_clicks"]),
    // Post-level
    media_id: checkField(["media_id", "mediaid", "id", "post_id"]),
    publish_date: checkField(["publish_date", "timestamp", "date", "created_at", "published_at"]),
    media_type: checkField(["media_type", "type", "content_type"]),
    likes: checkField(["likes", "like_count", "like"]),
    comments: checkField(["comments", "comments_count", "comment_count", "comment"]),
    shares: checkField(["shares", "share_count", "share"]),
    saves: checkField(["saves", "save_count", "saved"]),
    video_views: checkField(["video_views", "video_view_count", "views", "view_count"]),
    caption: checkField(["caption", "text", "description", "message"]),
    permalink: checkField(["permalink", "url", "link", "post_url"]),
    // Stories
    story_views: checkField(["story_views", "story_view_count", "story_view"]),
    story_replies: checkField(["story_replies", "story_reply_count", "story_reply"]),
    exits: checkField(["exits", "exit_count", "story_exits"]),
  };
}

function processInstagramData(rawData: any[], availableFields: AvailableFields): InstagramAnalyticsResponse {
  const posts: InstagramPost[] = [];
  
  // Only process if media_id exists
  if (!availableFields.media_id) {
    return {
      posts: [],
      availableFields,
      kpis: { totalPosts: 0 },
      topPosts: {},
      timeTrends: { last7Days: [] },
      timestamp: new Date().toISOString(),
    };
  }

  // Accumulators - only initialize if field is available
  let totalReach = 0;
  let totalImpressions = 0;
  let totalInteractions = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let totalVideoViews = 0;
  let followersCount = 0;
  let newFollowers = 0;
  let profileVisits = 0;
  let websiteClicks = 0;
  let totalStoryViews = 0;
  let totalStoryReplies = 0;
  let totalExits = 0;

  let hasReach = false;
  let hasImpressions = false;
  let hasInteractions = false;
  let hasLikes = false;
  let hasComments = false;
  let hasShares = false;
  let hasSaves = false;
  let hasVideoViews = false;
  let hasFollowers = false;
  let hasNewFollowers = false;
  let hasProfileVisits = false;
  let hasWebsiteClicks = false;
  let hasStoryViews = false;
  let hasStoryReplies = false;
  let hasExits = false;

  // Process each row
  for (const row of rawData) {
    const mediaId = extractStringValue(row, ["media_id", "mediaid", "id", "post_id"]);
    if (!mediaId) continue;

    const post: InstagramPost = { media_id: mediaId };

    // Extract fields only if they exist
    if (availableFields.publish_date) {
      const timestamp = extractStringValue(row, ["publish_date", "timestamp", "date", "created_at", "published_at"]);
      if (timestamp) post.timestamp = timestamp;
    }

    if (availableFields.reach) {
      const reach = extractNumberValue(row, ["reach", "reach_count"]);
      if (reach !== null) {
        post.reach = reach;
        totalReach += reach;
        hasReach = true;
      }
    }

    if (availableFields.impressions) {
      const impressions = extractNumberValue(row, ["impressions", "impression", "impression_count"]);
      if (impressions !== null) {
        post.impressions = impressions;
        totalImpressions += impressions;
        hasImpressions = true;
      }
    }

    if (availableFields.likes) {
      const likes = extractNumberValue(row, ["likes", "like_count", "like"]);
      if (likes !== null) {
        post.likes = likes;
        totalLikes += likes;
        hasLikes = true;
      }
    }

    if (availableFields.comments) {
      const comments = extractNumberValue(row, ["comments", "comments_count", "comment_count", "comment"]);
      if (comments !== null) {
        post.comments = comments;
        totalComments += comments;
        hasComments = true;
      }
    }

    if (availableFields.shares) {
      const shares = extractNumberValue(row, ["shares", "share_count", "share"]);
      if (shares !== null) {
        post.shares = shares;
        totalShares += shares;
        hasShares = true;
      }
    }

    if (availableFields.saves) {
      const saves = extractNumberValue(row, ["saves", "save_count", "saved"]);
      if (saves !== null) {
        post.saves = saves;
        totalSaves += saves;
        hasSaves = true;
      }
    }

    if (availableFields.video_views) {
      const videoViews = extractNumberValue(row, ["video_views", "video_view_count", "views", "view_count"]);
      if (videoViews !== null) {
        post.video_views = videoViews;
        totalVideoViews += videoViews;
        hasVideoViews = true;
      }
    }

    // Calculate interactions only if components exist
    if (hasLikes || hasComments || hasShares) {
      const interactions = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      if (interactions > 0) {
        post.total_interactions = interactions;
        totalInteractions += interactions;
        hasInteractions = true;
      }
    }

    if (availableFields.media_type) {
      const mediaType = extractStringValue(row, ["media_type", "type", "content_type"]);
      if (mediaType) post.media_type = mediaType;
    }

    if (availableFields.caption) {
      const caption = extractStringValue(row, ["caption", "text", "description", "message"]);
      if (caption) post.caption = caption;
    }

    if (availableFields.permalink) {
      const permalink = extractStringValue(row, ["permalink", "url", "link", "post_url"]);
      if (permalink) post.permalink = permalink;
    }

    // Account-level fields (usually in separate rows or first row)
    if (availableFields.followers_count) {
      const followers = extractNumberValue(row, ["followers_count", "followers", "follower_count"]);
      if (followers !== null) {
        followersCount = followers; // Usually single value
        hasFollowers = true;
      }
    }

    if (availableFields.new_followers) {
      const newFollower = extractNumberValue(row, ["new_followers", "new_follower", "followers_gained"]);
      if (newFollower !== null) {
        newFollowers += newFollower;
        hasNewFollowers = true;
      }
    }

    if (availableFields.profile_visits) {
      const profileVisit = extractNumberValue(row, ["profile_visits", "profile_visit", "profile_views"]);
      if (profileVisit !== null) {
        profileVisits += profileVisit;
        hasProfileVisits = true;
      }
    }

    if (availableFields.website_clicks) {
      const websiteClick = extractNumberValue(row, ["website_clicks", "website_click", "link_clicks"]);
      if (websiteClick !== null) {
        websiteClicks += websiteClick;
        hasWebsiteClicks = true;
      }
    }

    // Stories fields
    if (availableFields.story_views) {
      const storyView = extractNumberValue(row, ["story_views", "story_view_count", "story_view"]);
      if (storyView !== null) {
        totalStoryViews += storyView;
        hasStoryViews = true;
      }
    }

    if (availableFields.story_replies) {
      const storyReply = extractNumberValue(row, ["story_replies", "story_reply_count", "story_reply"]);
      if (storyReply !== null) {
        totalStoryReplies += storyReply;
        hasStoryReplies = true;
      }
    }

    if (availableFields.exits) {
      const exit = extractNumberValue(row, ["exits", "exit_count", "story_exits"]);
      if (exit !== null) {
        totalExits += exit;
        hasExits = true;
      }
    }

    posts.push(post);
  }

  // Build KPIs object - only include fields that have data
  const kpis: any = { totalPosts: posts.length };
  
  if (hasReach) kpis.totalReach = totalReach;
  if (hasImpressions) kpis.totalImpressions = totalImpressions;
  if (hasInteractions) kpis.totalInteractions = totalInteractions;
  if (hasLikes) kpis.totalLikes = totalLikes;
  if (hasComments) kpis.totalComments = totalComments;
  if (hasShares) kpis.totalShares = totalShares;
  if (hasSaves) kpis.totalSaves = totalSaves;
  if (hasVideoViews) kpis.totalVideoViews = totalVideoViews;
  if (hasFollowers) kpis.followersCount = followersCount;
  if (hasNewFollowers) kpis.newFollowers = newFollowers;
  if (hasProfileVisits) kpis.profileVisits = profileVisits;
  if (hasWebsiteClicks) kpis.websiteClicks = websiteClicks;
  if (hasStoryViews) kpis.totalStoryViews = totalStoryViews;
  if (hasStoryReplies) kpis.totalStoryReplies = totalStoryReplies;
  if (hasExits) kpis.totalExits = totalExits;

  // Build top posts - only if relevant fields exist
  const topPosts: any = {};
  
  if (hasReach) {
    topPosts.byReach = [...posts]
      .filter(p => p.reach !== undefined && p.reach !== null)
      .sort((a, b) => (b.reach || 0) - (a.reach || 0))
      .slice(0, 5);
  }

  if (hasImpressions) {
    topPosts.byImpressions = [...posts]
      .filter(p => p.impressions !== undefined && p.impressions !== null)
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 5);
  }

  if (hasInteractions) {
    topPosts.byInteractions = [...posts]
      .filter(p => p.total_interactions !== undefined && p.total_interactions !== null)
      .sort((a, b) => (b.total_interactions || 0) - (a.total_interactions || 0))
      .slice(0, 5);
  }

  if (hasLikes) {
    topPosts.byLikes = [...posts]
      .filter(p => p.likes !== undefined && p.likes !== null)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5);
  }

  if (hasVideoViews) {
    topPosts.byVideoViews = [...posts]
      .filter(p => p.video_views !== undefined && p.video_views !== null)
      .sort((a, b) => (b.video_views || 0) - (a.video_views || 0))
      .slice(0, 5);
  }

  // Calculate time trends - only if timestamp and relevant metrics exist
  const timeTrends: { [date: string]: any } = {};
  
  if (availableFields.publish_date && (hasReach || hasImpressions || hasInteractions || hasLikes || hasComments)) {
    const now = new Date();
    const last7Days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      last7Days.push(date);
    }

    posts.forEach((post) => {
      if (!post.timestamp) return;
      
      try {
        const postDate = new Date(post.timestamp);
        if (isNaN(postDate.getTime())) return;

        const dateKey = postDate.toISOString().split("T")[0];
        
        if (last7Days.some(d => d.toISOString().split("T")[0] === dateKey)) {
          if (!timeTrends[dateKey]) {
            timeTrends[dateKey] = {};
          }
          
          if (post.reach !== undefined && post.reach !== null) {
            timeTrends[dateKey].reach = (timeTrends[dateKey].reach || 0) + post.reach;
          }
          if (post.impressions !== undefined && post.impressions !== null) {
            timeTrends[dateKey].impressions = (timeTrends[dateKey].impressions || 0) + post.impressions;
          }
          if (post.total_interactions !== undefined && post.total_interactions !== null) {
            timeTrends[dateKey].interactions = (timeTrends[dateKey].interactions || 0) + post.total_interactions;
          }
          if (post.likes !== undefined && post.likes !== null) {
            timeTrends[dateKey].likes = (timeTrends[dateKey].likes || 0) + post.likes;
          }
          if (post.comments !== undefined && post.comments !== null) {
            timeTrends[dateKey].comments = (timeTrends[dateKey].comments || 0) + post.comments;
          }
        }
      } catch (e) {
        // Ignore invalid dates
      }
    });

    const last7DaysData = last7Days
      .map(date => {
        const dateKey = date.toISOString().split("T")[0];
        return {
          date: dateKey,
          ...(timeTrends[dateKey] || {}),
        };
      })
      .reverse();

    return {
      posts,
      availableFields,
      kpis,
      topPosts,
      timeTrends: { last7Days: last7DaysData },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    posts,
    availableFields,
    kpis,
    topPosts,
    timeTrends: { last7Days: [] },
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch data from Google Sheets
    const { data: rawData, headers } = await getGoogleSheetsData();
    
    // Detect available fields
    const availableFields = detectAvailableFields(rawData);
    
    // Process data
    const analytics = processInstagramData(rawData, availableFields);
    
    // Update cache
    cache = {
      data: analytics,
      timestamp: Date.now(),
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error("API Error:", error);
    const errorMessage = error.message || "Failed to fetch Instagram analytics data";
    
    return NextResponse.json(
      { 
        posts: [],
        availableFields: {
          followers_count: false,
          new_followers: false,
          reach: false,
          impressions: false,
          profile_visits: false,
          website_clicks: false,
          media_id: false,
          publish_date: false,
          media_type: false,
          likes: false,
          comments: false,
          shares: false,
          saves: false,
          video_views: false,
          caption: false,
          permalink: false,
          story_views: false,
          story_replies: false,
          exits: false,
        },
        kpis: { totalPosts: 0 },
        topPosts: {},
        timeTrends: { last7Days: [] },
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
