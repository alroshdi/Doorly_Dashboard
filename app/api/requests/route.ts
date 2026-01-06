import { NextResponse } from "next/server";
import { google } from "googleapis";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

let cache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds (reduced from 60)

async function getGoogleSheetsData() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE || "requests!A:Z";

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
    console.error("Error fetching Google Sheets data:", error);
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
    const fetchPromise = getGoogleSheetsData();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request timeout: Google Sheets API took too long")), 10000)
    );
    
    const data = await Promise.race([fetchPromise, timeoutPromise]) as any[];
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error);
    const errorMessage = error.message || "Failed to fetch data from Google Sheets";
    
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


