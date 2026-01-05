export interface LinkedInData {
  content: any;
  visitors: any;
  followers: any;
  competitors: any;
  timestamp: string;
}

export interface LinkedInKPIs {
  // Content Metrics
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  avgEngagementRate: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  
  // Follower Metrics
  totalFollowers: number;
  newFollowers: number;
  followerGrowthRate: number;
  followersByCountry: { name: string; value: number }[];
  followersByIndustry: { name: string; value: number }[];
  
  // Visitor Metrics
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  visitorsByCountry: { name: string; value: number }[];
  visitorsByIndustry: { name: string; value: number }[];
  
  // Competitor Metrics
  competitorComparison: { name: string; followers: number; engagement: number }[];
  
  // Time-based Metrics
  impressionsOverTime: { name: string; value: number }[];
  engagementsOverTime: { name: string; value: number }[];
  followersOverTime: { name: string; value: number }[];
  
  // User Source Metrics
  visitorsBySource: { name: string; value: number }[];
  followersBySource: { name: string; value: number }[];
  
  // Time Spent Metrics
  avgTimeSpent: number;
  timeSpentDistribution: { name: string; value: number }[];
  engagementTimeOverTime: { name: string; value: number }[];
  
  // Other Important Metrics
  topContent: { name: string; value: number }[];
  engagementByType: { name: string; value: number }[];
  reachBySource: { name: string; value: number }[];
}

export interface ChartData {
  name: string;
  value: number;
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
      if (typeof value === "number" && !isNaN(value)) return value;
      if (typeof value === "string") {
        const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
        if (!isNaN(parsed)) return parsed;
      }
    }
  }
  
  // Try to find any numeric value in the object
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === "number" && !isNaN(value) && value > 0) {
      return value;
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
  
  // Try to find any non-numeric string value that looks like a name/label
  for (const key in obj) {
    const value = String(obj[key] || "").trim();
    if (value && value !== "null" && value !== "undefined" && isNaN(parseFloat(value))) {
      // Check if it's not a date or number
      if (!value.match(/^\d{4}-\d{2}-\d{2}/) && value.length > 1) {
        return value;
      }
    }
  }
  
  return "";
}

export function calculateLinkedInKPIs(data: LinkedInData): LinkedInKPIs {
  const kpis: LinkedInKPIs = {
    totalPosts: 0,
    totalImpressions: 0,
    totalEngagements: 0,
    avgEngagementRate: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalClicks: 0,
    totalFollowers: 0,
    newFollowers: 0,
    followerGrowthRate: 0,
    followersByCountry: [],
    followersByIndustry: [],
    totalVisitors: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    visitorsByCountry: [],
    visitorsByIndustry: [],
    competitorComparison: [],
    impressionsOverTime: [],
    engagementsOverTime: [],
    followersOverTime: [],
    visitorsBySource: [],
    followersBySource: [],
    avgTimeSpent: 0,
    timeSpentDistribution: [],
    engagementTimeOverTime: [],
    topContent: [],
    engagementByType: [],
    reachBySource: [],
  };

  // Process Competitor Data FIRST to get Total Followers
  // This should be processed before followers data to prioritize the competitor analytics file
  if (data.competitors) {
    const competitorSheets = Object.values(data.competitors) as any[][];
    const allCompetitors: any[] = [];
    
    competitorSheets.forEach((sheet: any) => {
      if (Array.isArray(sheet)) {
        // Filter out empty objects and headers
        const validItems = sheet.filter((item: any) => 
          item && typeof item === "object" && Object.keys(item).length > 0
        );
        allCompetitors.push(...validItems);
      } else if (sheet && typeof sheet === "object") {
        // Handle single object
        allCompetitors.push(sheet);
      }
    });

    // Extract Total Followers from competitor analytics file
    // This file contains the main page's Total Followers metric (153 in the Excel file)
    allCompetitors.forEach((c: any) => {
      if (!c || typeof c !== "object") return;
      
      // First, try to find "Total Followers" column directly (case-insensitive)
      let totalFollowers = 0;
      for (const key in c) {
        if (key && typeof key === "string") {
          const normalizedKey = key.trim().toLowerCase();
          // Check for "total followers" variations
          if (normalizedKey === "total followers" || 
              normalizedKey === "total_followers" ||
              normalizedKey.includes("total") && normalizedKey.includes("followers")) {
            const value = c[key];
            if (typeof value === "number" && !isNaN(value) && value > 0) {
              totalFollowers = Math.max(totalFollowers, value);
            } else if (typeof value === "string") {
              const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
              if (!isNaN(parsed) && parsed > 0) {
                totalFollowers = Math.max(totalFollowers, parsed);
              }
            }
          }
        }
      }
      
      // If not found with direct check, use extractValue as fallback
      if (totalFollowers === 0) {
        totalFollowers = extractValue(c, [
          "total followers", 
          "total_followers", 
          "Total Followers",
          "followers", 
          "follower_count"
        ]);
      }
      
      if (totalFollowers > 0) {
        // Use the Total Followers value from competitor analytics file
        kpis.totalFollowers = Math.max(kpis.totalFollowers, totalFollowers);
      }
    });
  }

  // Process Content Data
  if (data.content) {
    const contentSheets = Object.values(data.content) as any[][];
    const allContent: any[] = [];
    
    contentSheets.forEach((sheet: any) => {
      if (Array.isArray(sheet)) {
        // Filter out empty objects and headers
        const validItems = sheet.filter((item: any) => 
          item && typeof item === "object" && Object.keys(item).length > 0
        );
        allContent.push(...validItems);
      } else if (sheet && typeof sheet === "object") {
        // Handle single object
        allContent.push(sheet);
      }
    });

    allContent.forEach((post: any) => {
      kpis.totalPosts++;
      kpis.totalImpressions += extractValue(post, ["impressions", "views", "reach"]);
      kpis.totalEngagements += extractValue(post, ["engagements", "engagement", "total_engagement"]);
      kpis.totalLikes += extractValue(post, ["likes", "like", "reactions"]);
      kpis.totalComments += extractValue(post, ["comments", "comment"]);
      kpis.totalShares += extractValue(post, ["shares", "share", "reposts"]);
      kpis.totalClicks += extractValue(post, ["clicks", "click", "link_clicks"]);
    });

    if (kpis.totalImpressions > 0) {
      kpis.avgEngagementRate = (kpis.totalEngagements / kpis.totalImpressions) * 100;
    }
  }

  // Process Followers Data
  if (data.followers) {
    const followerSheets = Object.values(data.followers) as any[][];
    const allFollowers: any[] = [];
    
    followerSheets.forEach((sheet: any) => {
      if (Array.isArray(sheet)) {
        // Filter out empty objects and headers
        const validItems = sheet.filter((item: any) => 
          item && typeof item === "object" && Object.keys(item).length > 0
        );
        allFollowers.push(...validItems);
      } else if (sheet && typeof sheet === "object") {
        // Handle single object
        allFollowers.push(sheet);
      }
    });

    // Get latest follower count
    // Only update if Total Followers wasn't already set from competitor analytics file
    const followerCounts = allFollowers
      .map((f: any) => extractValue(f, ["followers", "follower_count", "total_followers", "count"]))
      .filter((v: number) => v > 0);
    
    if (followerCounts.length > 0) {
      // Only use followers data if Total Followers wasn't already extracted from competitor file
      if (kpis.totalFollowers === 0) {
        kpis.totalFollowers = Math.max(...followerCounts);
      }
      kpis.newFollowers = followerCounts.length > 1 
        ? followerCounts[followerCounts.length - 1] - followerCounts[0]
        : followerCounts[0];
    }

    // Group by country
    const countryMap = new Map<string, number>();
    allFollowers.forEach((f: any) => {
      const country = extractStringValue(f, ["country", "location", "region"]);
      if (country) {
        const count = extractValue(f, ["followers", "count", "value"]);
        countryMap.set(country, (countryMap.get(country) || 0) + count);
      }
    });
    kpis.followersByCountry = Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group by industry
    const industryMap = new Map<string, number>();
    allFollowers.forEach((f: any) => {
      const industry = extractStringValue(f, ["industry", "sector", "category"]);
      if (industry) {
        const count = extractValue(f, ["followers", "count", "value"]);
        industryMap.set(industry, (industryMap.get(industry) || 0) + count);
      }
    });
    kpis.followersByIndustry = Array.from(industryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group followers by source
    const followerSourceMap = new Map<string, number>();
    allFollowers.forEach((f: any) => {
      const source = extractStringValue(f, ["source", "referrer", "traffic_source", "utm_source", "channel", "acquisition_source"]);
      if (source && source.toLowerCase() !== "direct") {
        followerSourceMap.set(source, (followerSourceMap.get(source) || 0) + 1);
      }
      // Skip "Direct" sources - don't add them to the map
    });
    kpis.followersBySource = Array.from(followerSourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0 && item.name.toLowerCase() !== "direct")
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  // Process Visitors Data
  if (data.visitors) {
    const visitorSheets = Object.values(data.visitors) as any[][];
    const allVisitors: any[] = [];
    
    visitorSheets.forEach((sheet: any) => {
      if (Array.isArray(sheet)) {
        // Filter out empty objects and headers
        const validItems = sheet.filter((item: any) => 
          item && typeof item === "object" && Object.keys(item).length > 0
        );
        allVisitors.push(...validItems);
      } else if (sheet && typeof sheet === "object") {
        // Handle single object
        allVisitors.push(sheet);
      }
    });

    kpis.totalVisitors = allVisitors.length;
    kpis.uniqueVisitors = new Set(
      allVisitors.map((v: any) => extractStringValue(v, ["visitor_id", "id", "user_id"]))
    ).size;
    kpis.pageViews = allVisitors.reduce((sum, v: any) => 
      sum + extractValue(v, ["page_views", "views", "count"]), 0
    );

    // Group by country
    const visitorCountryMap = new Map<string, number>();
    allVisitors.forEach((v: any) => {
      const country = extractStringValue(v, ["country", "location", "region"]);
      if (country) {
        visitorCountryMap.set(country, (visitorCountryMap.get(country) || 0) + 1);
      }
    });
    kpis.visitorsByCountry = Array.from(visitorCountryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group by industry
    const visitorIndustryMap = new Map<string, number>();
    allVisitors.forEach((v: any) => {
      const industry = extractStringValue(v, ["industry", "sector", "category"]);
      if (industry) {
        visitorIndustryMap.set(industry, (visitorIndustryMap.get(industry) || 0) + 1);
      }
    });
    kpis.visitorsByIndustry = Array.from(visitorIndustryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group visitors by source
    const visitorSourceMap = new Map<string, number>();
    allVisitors.forEach((v: any) => {
      const source = extractStringValue(v, ["source", "referrer", "traffic_source", "utm_source", "channel"]);
      if (source && source.toLowerCase() !== "direct") {
        visitorSourceMap.set(source, (visitorSourceMap.get(source) || 0) + 1);
      }
      // Skip "Direct" sources - don't add them to the map
    });
    kpis.visitorsBySource = Array.from(visitorSourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0 && item.name.toLowerCase() !== "direct")
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Calculate time spent metrics
    const timeSpentValues = allVisitors
      .map((v: any) => extractValue(v, ["time_spent", "duration", "session_duration", "time_on_page", "avg_time"]))
      .filter((v: number) => v > 0);
    
    if (timeSpentValues.length > 0) {
      kpis.avgTimeSpent = timeSpentValues.reduce((sum, val) => sum + val, 0) / timeSpentValues.length;
      
      // Time spent distribution (in minutes)
      const timeDistributionMap = new Map<string, number>();
      timeSpentValues.forEach((time: number) => {
        const minutes = Math.floor(time / 60);
        let bucket = "";
        if (minutes < 1) bucket = "< 1 min";
        else if (minutes < 5) bucket = "1-5 min";
        else if (minutes < 15) bucket = "5-15 min";
        else if (minutes < 30) bucket = "15-30 min";
        else bucket = "30+ min";
        
        timeDistributionMap.set(bucket, (timeDistributionMap.get(bucket) || 0) + 1);
      });
      kpis.timeSpentDistribution = Array.from(timeDistributionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const order = ["< 1 min", "1-5 min", "5-15 min", "15-30 min", "30+ min"];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });
    }
  }

  // Process Competitor Data (for competitor comparison)
  // Note: Total Followers was already extracted above, this section is for competitor comparison only
  if (data.competitors) {
    const competitorSheets = Object.values(data.competitors) as any[][];
    const allCompetitors: any[] = [];
    
    competitorSheets.forEach((sheet: any) => {
      if (Array.isArray(sheet)) {
        // Filter out empty objects and headers
        const validItems = sheet.filter((item: any) => 
          item && typeof item === "object" && Object.keys(item).length > 0
        );
        allCompetitors.push(...validItems);
      } else if (sheet && typeof sheet === "object") {
        // Handle single object
        allCompetitors.push(sheet);
      }
    });

    const competitorMap = new Map<string, { followers: number; engagement: number }>();
    
    allCompetitors.forEach((c: any) => {
      const name = extractStringValue(c, ["company", "name", "competitor", "page_name", "page"]);
      if (name) {
        const followers = extractValue(c, ["followers", "follower_count", "total_followers", "total followers"]);
        const engagement = extractValue(c, ["engagement", "engagements", "total_engagement", "total post engagements"]);
        
        if (competitorMap.has(name)) {
          const existing = competitorMap.get(name)!;
          competitorMap.set(name, {
            followers: Math.max(existing.followers, followers),
            engagement: existing.engagement + engagement,
          });
        } else {
          competitorMap.set(name, { followers, engagement });
        }
      }
    });

    kpis.competitorComparison = Array.from(competitorMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .filter(item => item.followers > 0)
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 10);
  }

  // Time-based metrics (simplified - would need date parsing)
  if (data.content) {
    const contentSheets = Object.values(data.content) as any[][];
    const allContent: any[] = [];
    
    contentSheets.forEach((sheet: any) => {
      if (Array.isArray(sheet)) {
        allContent.push(...sheet);
      }
    });

    // Group by month or week (simplified)
    const impressionsMap = new Map<string, number>();
    const engagementsMap = new Map<string, number>();
    
    allContent.forEach((post: any) => {
      const dateStr = extractStringValue(post, ["date", "created_at", "published_at", "time"]);
      const period = dateStr ? dateStr.substring(0, 7) : "Unknown"; // YYYY-MM
      
      impressionsMap.set(period, (impressionsMap.get(period) || 0) + 
        extractValue(post, ["impressions", "views", "reach"]));
      engagementsMap.set(period, (engagementsMap.get(period) || 0) + 
        extractValue(post, ["engagements", "engagement", "total_engagement"]));
    });

    kpis.impressionsOverTime = Array.from(impressionsMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);

    kpis.engagementsOverTime = Array.from(engagementsMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);

    // Top content by engagement
    const contentEngagementMap = new Map<string, number>();
    allContent.forEach((post: any) => {
      const title = extractStringValue(post, ["title", "post_title", "content_title", "name"]);
      const engagement = extractValue(post, ["engagements", "engagement", "total_engagement"]);
      if (title && engagement > 0) {
        const shortTitle = title.length > 30 ? title.substring(0, 30) + "..." : title;
        contentEngagementMap.set(shortTitle, (contentEngagementMap.get(shortTitle) || 0) + engagement);
      }
    });
    kpis.topContent = Array.from(contentEngagementMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Engagement by type
    kpis.engagementByType = [
      { name: "Likes", value: kpis.totalLikes },
      { name: "Comments", value: kpis.totalComments },
      { name: "Shares", value: kpis.totalShares },
      { name: "Clicks", value: kpis.totalClicks },
    ].filter(item => item.value > 0);

    // Reach by source (from content data)
    const reachSourceMap = new Map<string, number>();
    allContent.forEach((post: any) => {
      const source = extractStringValue(post, ["source", "channel", "post_source"]);
      const reach = extractValue(post, ["reach", "impressions", "views"]);
      if (source && reach > 0) {
        reachSourceMap.set(source, (reachSourceMap.get(source) || 0) + reach);
      }
    });
    kpis.reachBySource = Array.from(reachSourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Engagement time over time (simplified - using engagement data)
    const engagementTimeMap = new Map<string, number>();
    allContent.forEach((post: any) => {
      const dateStr = extractStringValue(post, ["date", "created_at", "published_at", "time"]);
      const period = dateStr ? dateStr.substring(0, 7) : "Unknown";
      const engagement = extractValue(post, ["engagements", "engagement", "total_engagement"]);
      if (engagement > 0) {
        engagementTimeMap.set(period, (engagementTimeMap.get(period) || 0) + engagement);
      }
    });
    kpis.engagementTimeOverTime = Array.from(engagementTimeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);
  }

  return kpis;
}


