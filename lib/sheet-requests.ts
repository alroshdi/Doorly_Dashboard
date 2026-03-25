import { google } from "googleapis";
import type { RequestData } from "@/lib/analytics";

let cache: { data: RequestData[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000;

export function clearSheetRequestsCache(): void {
  cache = null;
}

/**
 * Fetches the same Google Sheet rows as /api/requests (live “database” for this app).
 */
export async function fetchSheetRequests(options?: { bypassCache?: boolean }): Promise<RequestData[]> {
  if (!options?.bypassCache && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
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
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    cache = { data: [], timestamp: Date.now() };
    return [];
  }

  const headers = rows[0].map((h: string) => h.toLowerCase().replace(/\s+/g, "_").trim());
  const data: RequestData[] = rows.slice(1).map((row: string[]) => {
    const obj: RequestData = {};
    headers.forEach((header: string, index: number) => {
      const cellValue = row[index];
      obj[header] = cellValue !== undefined ? cellValue : "";
    });
    return obj;
  });

  const requestIdColumn = headers.find((h) => h.includes("request_id") || h.includes("id"));
  const filtered = requestIdColumn
    ? data.filter((obj) => {
        const id = obj[requestIdColumn];
        return id !== "" && id !== null && id !== undefined;
      })
    : data;

  cache = { data: filtered, timestamp: Date.now() };
  return filtered;
}
