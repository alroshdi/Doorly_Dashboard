import { NextResponse } from "next/server";
import { google } from "googleapis";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Instagram Graph API helper functions
async function getInstagramInsights(mediaId: string, accessToken: string) {
  try {
    const url = `https://graph.instagram.com/${mediaId}/insights?metric=engagement,impressions,reach,saved&access_token=${accessToken}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Instagram API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Parse insights data
    const insights: any = {
      engagement: 0,
      impressions: 0,
      reach: 0,
      saved: 0,
    };

    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((metric: any) => {
        if (metric.name === 'engagement') {
          insights.engagement = metric.values?.[0]?.value || 0;
        } else if (metric.name === 'impressions') {
          insights.impressions = metric.values?.[0]?.value || 0;
        } else if (metric.name === 'reach') {
          insights.reach = metric.values?.[0]?.value || 0;
        } else if (metric.name === 'saved') {
          insights.saved = metric.values?.[0]?.value || 0;
        }
      });
    }

    // Calculate likes and comments from engagement
    // Engagement = likes + comments + saves
    // We'll estimate: likes = engagement - saved, comments = engagement * 0.1
    const estimatedLikes = Math.max(0, insights.engagement - insights.saved);
    const estimatedComments = Math.round(insights.engagement * 0.1);

    return {
      likes: estimatedLikes,
      comments: estimatedComments,
      saves: insights.saved,
      reach: insights.reach,
      impressions: insights.impressions,
      engagement: insights.engagement,
    };
  } catch (error: any) {
    console.error(`Error fetching insights for media ${mediaId}:`, error);
    throw error;
  }
}

// Get all media IDs from Google Sheet
async function getMediaIdsFromSheet() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !serviceAccountKey || !sheetId) {
      throw new Error("Missing Google Sheets credentials");
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "insta!A:Z",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { mediaIds: [], headers: [], mediaIdColumnIndex: -1 };
    }

    // First row is headers
    const headers = rows[0].map((h: string) => 
      h.toLowerCase().replace(/\s+/g, "_").trim()
    );
    
    // Find media_id column index
    const mediaIdColumnIndex = headers.findIndex(h => 
      h.includes("media_id") || h.includes("mediaid") || h.includes("id")
    );

    if (mediaIdColumnIndex === -1) {
      throw new Error("media_id column not found in sheet");
    }

    // Extract media IDs from rows
    const mediaIds: { id: string; rowIndex: number }[] = [];
    rows.slice(1).forEach((row, index) => {
      const mediaId = row[mediaIdColumnIndex];
      if (mediaId && String(mediaId).trim()) {
        mediaIds.push({
          id: String(mediaId).trim(),
          rowIndex: index + 2, // +2 because: +1 for header row, +1 for 0-based to 1-based
        });
      }
    });

    return { mediaIds, headers, mediaIdColumnIndex };
  } catch (error: any) {
    console.error("Error fetching media IDs from Google Sheets:", error);
    throw error;
  }
}

// Update Google Sheet with insights data
async function updateSheetWithInsights(
  rowIndex: number,
  insights: { likes: number; comments: number; saves: number; reach: number },
  headers: string[]
) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !serviceAccountKey || !sheetId) {
      throw new Error("Missing Google Sheets credentials");
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Find column indices for likes, comments, saves, reach
    const likesColumnIndex = headers.findIndex(h => 
      h.includes("likes") || h.includes("like")
    );
    const commentsColumnIndex = headers.findIndex(h => 
      h.includes("comments") || h.includes("comment")
    );
    const savesColumnIndex = headers.findIndex(h => 
      h.includes("saves") || h.includes("save")
    );
    const reachColumnIndex = headers.findIndex(h => 
      h.includes("reach") || h.includes("impressions")
    );

    // Helper function to convert column index to letter (A, B, ..., Z, AA, AB, ...)
    const getColumnLetter = (index: number): string => {
      let result = '';
      while (index >= 0) {
        result = String.fromCharCode(65 + (index % 26)) + result;
        index = Math.floor(index / 26) - 1;
      }
      return result;
    };

    // Prepare update requests
    const updateRequests: any[] = [];

    if (likesColumnIndex !== -1) {
      updateRequests.push({
        range: `insta!${getColumnLetter(likesColumnIndex)}${rowIndex}`,
        values: [[insights.likes]],
      });
    }

    if (commentsColumnIndex !== -1) {
      updateRequests.push({
        range: `insta!${getColumnLetter(commentsColumnIndex)}${rowIndex}`,
        values: [[insights.comments]],
      });
    }

    if (savesColumnIndex !== -1) {
      updateRequests.push({
        range: `insta!${getColumnLetter(savesColumnIndex)}${rowIndex}`,
        values: [[insights.saves]],
      });
    }

    if (reachColumnIndex !== -1) {
      updateRequests.push({
        range: `insta!${getColumnLetter(reachColumnIndex)}${rowIndex}`,
        values: [[insights.reach]],
      });
    }

    // Batch update
    if (updateRequests.length > 0) {
      const data = updateRequests.map(req => ({
        range: req.range,
        values: req.values,
      }));

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: data,
        },
      });
    }
  } catch (error: any) {
    console.error(`Error updating sheet for row ${rowIndex}:`, error);
    throw error;
  }
}

// Main refresh function
async function refreshInstagramInsights() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error("INSTAGRAM_ACCESS_TOKEN environment variable is required");
  }

  try {
    // Get all media IDs from sheet
    const { mediaIds, headers, mediaIdColumnIndex } = await getMediaIdsFromSheet();
    
    if (mediaIds.length === 0) {
      return {
        success: true,
        message: "No media IDs found in sheet",
        updated: 0,
        errors: [],
      };
    }

    const results = {
      updated: 0,
      errors: [] as Array<{ mediaId: string; error: string }>,
    };

    // Process each media ID with rate limiting (to avoid API limits)
    for (let i = 0; i < mediaIds.length; i++) {
      const { id: mediaId, rowIndex } = mediaIds[i];
      
      try {
        // Fetch insights from Instagram Graph API
        const insights = await getInstagramInsights(mediaId, accessToken);
        
        // Update Google Sheet
        await updateSheetWithInsights(rowIndex, insights, headers);
        
        results.updated++;
        
        // Rate limiting: wait 1 second between requests
        if (i < mediaIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`Error processing media ${mediaId}:`, error);
        results.errors.push({
          mediaId,
          error: error.message || "Unknown error",
        });
      }
    }

    return {
      success: true,
      message: `Refreshed insights for ${results.updated} posts`,
      updated: results.updated,
      total: mediaIds.length,
      errors: results.errors,
    };
  } catch (error: any) {
    console.error("Error refreshing Instagram insights:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Optional: Add authentication/authorization check here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await refreshInstagramInsights();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to refresh Instagram insights",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggers
export async function GET(request: Request) {
  return POST(request);
}

