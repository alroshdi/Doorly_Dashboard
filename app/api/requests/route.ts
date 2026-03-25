import { NextResponse } from "next/server";
import { fetchSheetRequests, clearSheetRequestsCache } from "@/lib/sheet-requests";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get("refresh") === "true";

    if (bypassCache) {
      clearSheetRequestsCache();
    }

    const data = await fetchSheetRequests({ bypassCache });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch data";
    console.error("API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
