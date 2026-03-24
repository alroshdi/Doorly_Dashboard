import { NextResponse } from "next/server";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { parseLinkedInWorkbook } from "@/lib/linkedin-parse";

export const dynamic = "force-dynamic";

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

function pickLatestExport(files: string[], pattern: RegExp): string | null {
  const matches = files.filter((f) => pattern.test(f));
  if (!matches.length) return null;
  matches.sort((a, b) => {
    const ma = a.match(/_(\d+)\.(xls|xlsx)$/i);
    const mb = b.match(/_(\d+)\.(xls|xlsx)$/i);
    const ta = ma ? parseInt(ma[1], 10) : 0;
    const tb = mb ? parseInt(mb[1], 10) : 0;
    return tb - ta;
  });
  return matches[0];
}

function resolveLinkedInDir(): string {
  const possiblePaths = [
    join(process.cwd(), "linkedin"),
    join(process.cwd(), "..", "linkedin"),
    join(__dirname, "..", "..", "..", "linkedin"),
  ];
  for (const p of possiblePaths) {
    try {
      if (existsSync(p)) return p;
    } catch {
      /* continue */
    }
  }
  throw new Error("LinkedIn data folder not found. Add exports under the project `linkedin` folder.");
}

async function getLinkedInData() {
  const basePath = resolveLinkedInDir();
  const files = readdirSync(basePath);

  const contentName = pickLatestExport(files, /doorly_content_\d+\.xls$/i);
  const visitorsName = pickLatestExport(files, /doorly_visitors_\d+\.xls$/i);
  const followersName = pickLatestExport(files, /doorly_followers_\d+\.xls$/i);
  const competitorName =
    pickLatestExport(files, /competitor.*\.xlsx$/i) ||
    files.find((f) => /\.xlsx$/i.test(f) && /competitor/i.test(f)) ||
    null;

  if (!contentName || !visitorsName || !followersName) {
    throw new Error(
      "Missing LinkedIn exports. Expected files matching *doorly_content_*.xls, *doorly_visitors_*.xls, *doorly_followers_*.xls"
    );
  }

  const content = parseLinkedInWorkbook(join(basePath, contentName));
  const visitors = parseLinkedInWorkbook(join(basePath, visitorsName));
  const followers = parseLinkedInWorkbook(join(basePath, followersName));
  const competitors = competitorName
    ? parseLinkedInWorkbook(join(basePath, competitorName))
    : {};

  const tsFromName = (name: string) => {
    const m = name.match(/_(\d+)\.(xls|xlsx)$/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const exportIds = [contentName, visitorsName, followersName]
    .map(tsFromName)
    .filter((n): n is number => n != null);

  return {
    content,
    visitors,
    followers,
    competitors,
    timestamp: new Date().toISOString(),
    sources: {
      content: contentName,
      visitors: visitorsName,
      followers: followersName,
      competitors: competitorName,
    },
    exportEpochMs:
      exportIds.length > 0 ? Math.min(...exportIds.map((id) => (id < 1e12 ? id * 1000 : id))) : null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "1" || searchParams.get("refresh") === "true";

    if (refresh) {
      cache = null;
    }

    const noStore = {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    } as const;

    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data, { headers: noStore });
    }

    const data = await getLinkedInData();
    cache = { data, timestamp: Date.now() };
    return NextResponse.json(data, { headers: noStore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch LinkedIn data";
    console.error("Error in LinkedIn API:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
