import { NextResponse } from "next/server";
import { google } from "googleapis";

let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface InstagramPost {
  media_id: string;
  timestamp?: string;
  reach?: number;
  total_interactions?: number;
  likes?: number;
  comments?: number;
  permalink?: string;
}

interface InstagramAnalyticsResponse {
  posts: InstagramPost[];
  kpis: {
    totalReach: number;
    totalInteractions: number;
    totalLikes: number;
    totalComments: number;
    totalPosts: number;
  };
  topPosts: {
    byReach: InstagramPost[];
    byInteractions: InstagramPost[];
  };
  timeTrends: {
    last7Days: Array<{ date: string; reach: number; interactions: number; likes: number; comments: number }>;
  };
  timestamp: string;
  error?: string | null;
}

async function getGoogleSheetsData() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const sheetName = process.env.SHEET_NAME || "insta_insights_daily";
    const range = `${sheetName}!A:Z`;

    if (!serviceAccountEmail || !serviceAccountKey || !sheetId) {
      throw new Error("Missing Google Sheets credentials");
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // First row is headers
    const headers = rows[0].map((h: string) => 
      String(h || "").trim().toLowerCase().replace(/\s+/g, "_")
    );
    
    // Convert rows to objects
    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        const cellValue = row[index];
        obj[header] = cellValue !== undefined ? cellValue : "";
      });
      return obj;
    });

    return data;
  } catch (error: any) {
    console.error("Error fetching Google Sheets data:", error);
    throw error;
  }
}

function normalizeKey(key: string): string {
  return String(key || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function extractValue(obj: any, possibleKeys: string[]): number {
  if (!obj || typeof obj !== "object") return 0;
  
  for (const key of possibleKeys) {
    const normalizedKey = normalizeKey(key);
    const found = Object.keys(obj).find(
      (k) => normalizeKey(k) === normalizedKey
    );
    if (found) {
      const value = obj[found];
      if (value === null || value === undefined || value === "") return 0;
      if (typeof value === "number" && !isNaN(value)) return value;
      if (typeof value === "string") {
        const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
        if (!isNaN(parsed)) return parsed;
      }
    }
  }
  
  return 0;
}

function extractStringValue(obj: any, possibleKeys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  
  for (const key of possibleKeys) {
    const normalizedKey = normalizeKey(key);
    const found = Object.keys(obj).find(
      (k) => normalizeKey(k) === normalizedKey
    );
    if (found) {
      const value = String(obj[found] || "").trim();
      if (value && value !== "null" && value !== "undefined") {
        return value;
      }
    }
  }
  
  return "";
}

function processInstagramData(rawData: any[]): InstagramAnalyticsResponse {
  const posts: InstagramPost[] = [];
  let totalReach = 0;
  let totalInteractions = 0;
  let totalLikes = 0;
  let totalComments = 0;

  // Process each row
  for (const row of rawData) {
    const mediaId = extractStringValue(row, ["media_id", "mediaid", "id"]);
    if (!mediaId) continue; // Skip rows without media_id

    const reach = extractValue(row, ["reach"]);
    const interactions = extractValue(row, ["total_interactions", "interactions", "engagement"]);
    const likes = extractValue(row, ["likes", "like_count"]);
    const comments = extractValue(row, ["comments", "comments_count"]);
    const timestamp = extractStringValue(row, ["timestamp", "date", "created_at", "publish_date"]);
    const permalink = extractStringValue(row, ["permalink", "url", "link"]);

    const post: InstagramPost = {
      media_id: mediaId,
      timestamp: timestamp || undefined,
      reach: reach || 0,
      total_interactions: interactions || 0,
      likes: likes || 0,
      comments: comments || 0,
      permalink: permalink || undefined,
    };

    posts.push(post);

    // Accumulate totals
    totalReach += reach;
    totalInteractions += interactions;
    totalLikes += likes;
    totalComments += comments;
  }

  // Sort posts by reach and interactions
  const topPostsByReach = [...posts]
    .sort((a, b) => (b.reach || 0) - (a.reach || 0))
    .slice(0, 5);

  const topPostsByInteractions = [...posts]
    .sort((a, b) => (b.total_interactions || 0) - (a.total_interactions || 0))
    .slice(0, 5);

  // Calculate time trends (last 7 days)
  const timeTrends: { [date: string]: { reach: number; interactions: number; likes: number; comments: number } } = {};
  
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
      
      // Only include dates from last 7 days
      if (last7Days.some(d => d.toISOString().split("T")[0] === dateKey)) {
        if (!timeTrends[dateKey]) {
          timeTrends[dateKey] = { reach: 0, interactions: 0, likes: 0, comments: 0 };
        }
        
        timeTrends[dateKey].reach += post.reach || 0;
        timeTrends[dateKey].interactions += post.total_interactions || 0;
        timeTrends[dateKey].likes += post.likes || 0;
        timeTrends[dateKey].comments += post.comments || 0;
      }
    } catch (e) {
      // Ignore invalid dates
    }
  });

  const last7DaysData = last7Days
    .map(date => {
      const dateKey = date.toISOString().split("T")[0];
      const data = timeTrends[dateKey] || { reach: 0, interactions: 0, likes: 0, comments: 0 };
      return {
        date: dateKey,
        ...data,
      };
    })
    .reverse(); // Oldest to newest

  return {
    posts,
    kpis: {
      totalReach,
      totalInteractions,
      totalLikes,
      totalComments,
      totalPosts: posts.length,
    },
    topPosts: {
      byReach: topPostsByReach,
      byInteractions: topPostsByInteractions,
    },
    timeTrends: {
      last7Days: last7DaysData,
    },
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
    const rawData = await getGoogleSheetsData();
    
    // Process data
    const analytics = processInstagramData(rawData);
    
    // Update cache
    cache = {
      data: analytics,
      timestamp: Date.now(),
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        posts: [],
        kpis: {
          totalReach: 0,
          totalInteractions: 0,
          totalLikes: 0,
          totalComments: 0,
          totalPosts: 0,
        },
        topPosts: {
          byReach: [],
          byInteractions: [],
        },
        timeTrends: {
          last7Days: [],
        },
        timestamp: new Date().toISOString(),
        error: error.message || "Failed to fetch Instagram analytics data",
      },
      { status: 500 }
    );
  }
}

