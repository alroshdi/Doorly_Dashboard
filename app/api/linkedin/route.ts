import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function parseExcelFile(filePath: string) {
  try {
    const fileBuffer = readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    
    const data: any = {};
    
    // Parse each sheet
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      data[sheetName] = jsonData;
    });
    
    return data;
  } catch (error: any) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

async function getLinkedInData() {
  try {
    // Try multiple possible paths for the linkedin folder
    const possiblePaths = [
      join(process.cwd(), "..", "linkedin"), // Development: parent directory
      join(process.cwd(), "linkedin"), // Same directory
      join(__dirname, "..", "..", "..", "linkedin"), // Alternative path
    ];
    
    let basePath: string | null = null;
    for (const path of possiblePaths) {
      try {
        if (existsSync(path)) {
          basePath = path;
          break;
        }
      } catch {
        // Continue to next path
      }
    }
    
    if (!basePath) {
      throw new Error("LinkedIn data folder not found. Please ensure the 'linkedin' folder exists.");
    }
    
    // Parse all LinkedIn files
    const contentData = parseExcelFile(join(basePath, "دورلي-doorly_content_1767085154803.xls"));
    const visitorsData = parseExcelFile(join(basePath, "دورلي-doorly_visitors_1767085157484.xls"));
    const followersData = parseExcelFile(join(basePath, "دورلي-doorly_followers_1767085160414.xls"));
    const competitorData = parseExcelFile(join(basePath, "دورلي - doorly_competitor_analytics_1767085167105.xlsx"));
    
    return {
      content: contentData || {},
      visitors: visitorsData || {},
      followers: followersData || {},
      competitors: competitorData || {},
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error fetching LinkedIn data:", error);
    throw error;
  }
}

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const data = await getLinkedInData();
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in LinkedIn API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch LinkedIn data" },
      { status: 500 }
    );
  }
}

