import { NextResponse } from "next/server";
import { google } from "googleapis";
import { subDays, format } from "date-fns";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Generate mock Instagram data for testing
function generateMockInstagramData() {
  const mockData: any[] = [];
  const now = new Date();
  const types = ["IMAGE", "VIDEO", "REEL"];
  
  // Generate 35 posts spread across last 30 days
  for (let i = 0; i < 35; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const postDate = subDays(now, daysAgo);
    const hour = Math.floor(Math.random() * 24);
    postDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    
    const type = types[Math.floor(Math.random() * types.length)];
    const baseEngagement = type === "REEL" ? 500 : type === "VIDEO" ? 300 : 200;
    
    const likes = Math.floor(baseEngagement * (0.7 + Math.random() * 0.6));
    const comments = Math.floor(likes * (0.05 + Math.random() * 0.1));
    const saves = Math.floor(likes * (0.02 + Math.random() * 0.05));
    const reach = Math.floor(likes * (1.5 + Math.random() * 1.5));
    
    mockData.push({
      media_id: `mock_${i + 1}_${Date.now()}`,
      media_type: type,
      caption: `Mock Instagram post ${i + 1} - ${type.toLowerCase()} content with engaging caption text`,
      likes: likes,
      comments: comments,
      saves: saves,
      reach: reach,
      timestamp: postDate.toISOString(),
      // Also support lowercase column names from Google Sheets
      media_id_lower: `mock_${i + 1}_${Date.now()}`,
      media_type_lower: type.toLowerCase(),
      likes_lower: likes,
      comments_lower: comments,
      saves_lower: saves,
      reach_lower: reach,
      timestamp_lower: postDate.toISOString(),
    });
  }
  
  return mockData;
}

let cache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

async function getInstagramData() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = "insta!A:Z"; // Fetch from "insta" sheet

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
      h.toLowerCase().replace(/\s+/g, "_").trim()
    );
    
    // Convert rows to objects
    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    return data;
  } catch (error: any) {
    console.error("Error fetching Instagram data from Google Sheets:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    // Check for cache bypass parameter
    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get("refresh") === "true" || searchParams.get("nocache") === "true";
    
    // Check cache (unless bypassed)
    if (!bypassCache && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch fresh data with timeout
    const fetchPromise = getInstagramData();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request timeout: Google Sheets API took too long. Please check your credentials and sheet permissions.")), 20000)
    );
    
    let data: any[];
    try {
      data = await Promise.race([fetchPromise, timeoutPromise]) as any[];
    } catch (raceError: any) {
      throw raceError;
    }
    
    // Validate data is an array
    if (!Array.isArray(data)) {
      console.warn("Google Sheets returned non-array data, converting to array");
      data = [];
    }
    
    // If no data or empty array, return mock data for testing
    if (data.length === 0) {
      console.log("No Instagram data found, returning mock data for testing");
      data = generateMockInstagramData();
    }
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error);
    let errorMessage = error.message || "Failed to fetch Instagram data from Google Sheets";
    
    // Provide more helpful error messages
    if (errorMessage.includes("Missing Google Sheets credentials")) {
      errorMessage = "Google Sheets credentials are missing. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, and GOOGLE_SHEET_ID in environment variables.";
    } else if (errorMessage.includes("timeout")) {
      errorMessage = "Request timeout. Google Sheets API is taking too long. Please check your sheet permissions and try again.";
    } else if (errorMessage.includes("permission") || errorMessage.includes("403")) {
      errorMessage = "Permission denied. Please check that your service account has access to the Google Sheet.";
    } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      errorMessage = "Google Sheet not found. Please check your GOOGLE_SHEET_ID environment variable.";
    }
    
    // Return proper error response
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

