import { NextResponse } from "next/server";
import { fetchSheetRequests, clearSheetRequestsCache } from "@/lib/sheet-requests";
import { buildAdminReport } from "@/lib/admin-report";
import { generateAdminReportPdf } from "@/lib/generate-admin-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";
    if (refresh) {
      clearSheetRequestsCache();
    }

    const rows = await fetchSheetRequests({ bypassCache: refresh });
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const payload = buildAdminReport(rows, { from, to });
    const pdf = generateAdminReportPdf(payload);

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `doorly-admin-report-${dateStamp}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
