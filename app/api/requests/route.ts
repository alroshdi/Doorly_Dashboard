import { NextResponse } from "next/server";
import { google } from "googleapis";

let cache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

async function getGoogleSheetsData() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;
    // Use a larger range to ensure we get all columns and rows
    // Google Sheets supports up to column ZZ, but we'll use A:ZZ to be safe
    const range = process.env.GOOGLE_SHEET_RANGE || "requests!A:ZZ";

    if (!serviceAccountEmail || !serviceAccountKey || !sheetId) {
      throw new Error("Missing Google Sheets credentials");
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    // Fetch all data - Google Sheets API will return all rows automatically
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("No rows found in Google Sheets");
      return [];
    }
    
    console.log(`Fetched ${rows.length} rows from Google Sheets (including header)`);

    // First row is headers
    const headers = rows[0].map((h: string) => 
      h.toLowerCase().replace(/\s+/g, "_").trim()
    );
    
    // Convert rows to objects
    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        // Preserve actual values including 0, empty strings, and null
        // Only default to "" if the cell is truly undefined
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

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch fresh data
    const data = await getGoogleSheetsData();
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}


