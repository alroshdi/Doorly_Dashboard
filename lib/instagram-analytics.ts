export interface InstagramData {
  posts: Array<{
    id: string;
    type: string;
    caption: string;
    reach: number;
    impressions: number;
    saved: number;
    engagement: number;
    engagementRate: number;
    timestamp: string;
    likes: number;
    comments: number;
  }>;
  timestamp: string;
}

export interface InstagramKPIs {
  // Basic Metrics
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  avgEngagementPerPost: number;
  
  // Content Type Metrics
  contentTypePerformance: { name: string; value: number }[];
  avgEngagementByType: { name: string; value: number }[];
  
  // Time-based Metrics
  engagementOverTime: { name: string; value: number }[];
  reachOverTime: { name: string; value: number }[];
  
  // Best Performing
  bestPostingTime: string;
  peakEngagementTime: string;
  
  // Posts Data for Table
  postsData: {
    id: string;
    type: string;
    caption: string;
    likes: number;
    comments: number;
    saves: number;
    reach: number;
    engagementRate: number;
    publishDate: string;
  }[];
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
  
  return "";
}

export function calculateInstagramKPIs(data: InstagramData): InstagramKPIs {
  const kpis: InstagramKPIs = {
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSaves: 0,
    totalReach: 0,
    totalEngagement: 0,
    avgEngagementRate: 0,
    avgEngagementPerPost: 0,
    contentTypePerformance: [],
    avgEngagementByType: [],
    engagementOverTime: [],
    reachOverTime: [],
    bestPostingTime: "غير متوفر",
    peakEngagementTime: "",
    postsData: [],
  };

  // Process Posts Data - Now data.posts is directly an array
  if (data.posts && Array.isArray(data.posts)) {
    const allPosts = data.posts;

    // Content type aggregation
    const typeStats: { [key: string]: { total: number; count: number; engagement: number } } = {};
    const timeStats: { [key: string]: { engagement: number; count: number } } = {};
    const engagementByDate: { [key: string]: number } = {};
    const reachByDate: { [key: string]: number } = {};

    allPosts.forEach((post: any) => {
      // Extract values directly from API response
      const likes = post.likes || 0;
      const comments = post.comments || 0;
      const saves = post.saved || 0;
      const reach = post.reach || 0;
      const engagement = post.engagement || 0; // Use engagement from API (which is total_interactions for videos)
      
      // Extract post type
      const postType = post.type || "غير محدد";
      const normalizedType = postType;
      
      // Extract date
      const dateStr = post.timestamp || "";
      
      // Extract post ID
      const postId = post.id || "unknown";
      
      // Extract caption
      const caption = post.caption || "";

      // Accumulate totals
      kpis.totalPosts++;
      kpis.totalLikes += likes;
      kpis.totalComments += comments;
      kpis.totalSaves += saves;
      kpis.totalReach += reach;
      kpis.totalEngagement += engagement;

      // Content type statistics
      if (!typeStats[normalizedType]) {
        typeStats[normalizedType] = { total: 0, count: 0, engagement: 0 };
      }
      typeStats[normalizedType].total += engagement;
      typeStats[normalizedType].count++;
      typeStats[normalizedType].engagement += engagement;

      // Time-based statistics (extract hour from timestamp if available)
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const hour = date.getHours();
            const hourKey = `${hour}:00`;
            if (!timeStats[hourKey]) {
              timeStats[hourKey] = { engagement: 0, count: 0 };
            }
            timeStats[hourKey].engagement += engagement;
            timeStats[hourKey].count++;

            // Group by date for time series charts
            const dateKey = date.toISOString().split('T')[0];
            if (!engagementByDate[dateKey]) {
              engagementByDate[dateKey] = 0;
            }
            engagementByDate[dateKey] += engagement;

            if (!reachByDate[dateKey]) {
              reachByDate[dateKey] = 0;
            }
            reachByDate[dateKey] += reach;
          }
        } catch (e) {
          // Ignore date parsing errors
        }
      }

      // Store post data for table - use engagementRate from API or calculate
      const engagementRate = post.engagementRate || (reach > 0 ? (engagement / reach) * 100 : 0);
      kpis.postsData.push({
        id: postId,
        type: normalizedType,
        caption: caption.substring(0, 100) + (caption.length > 100 ? "..." : ""),
        likes: likes,
        comments: comments,
        saves: saves,
        reach: reach,
        engagementRate: engagementRate,
        publishDate: dateStr ? new Date(dateStr).toISOString().split('T')[0] : "غير متوفر",
      });
    });

    // Build time series data for charts
    kpis.engagementOverTime = Object.entries(engagementByDate)
      .map(([date, value]) => ({ name: date, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    kpis.reachOverTime = Object.entries(reachByDate)
      .map(([date, value]) => ({ name: date, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Calculate averages
    if (kpis.totalPosts > 0) {
      kpis.avgEngagementPerPost = kpis.totalEngagement / kpis.totalPosts;
    }
    
    if (kpis.totalReach > 0) {
      kpis.avgEngagementRate = (kpis.totalEngagement / kpis.totalReach) * 100;
    }

    // Process content type performance
    kpis.contentTypePerformance = Object.entries(typeStats).map(([type, stats]) => ({
      name: type,
      value: stats.total,
    })).sort((a, b) => b.value - a.value);

    // Process average engagement by type
    kpis.avgEngagementByType = Object.entries(typeStats).map(([type, stats]) => ({
      name: type,
      value: stats.count > 0 ? stats.engagement / stats.count : 0,
    })).sort((a, b) => b.value - a.value);

    // Find best posting time
    if (Object.keys(timeStats).length > 0) {
      const bestTime = Object.entries(timeStats)
        .sort((a, b) => {
          const avgA = a[1].count > 0 ? a[1].engagement / a[1].count : 0;
          const avgB = b[1].count > 0 ? b[1].engagement / b[1].count : 0;
          return avgB - avgA;
        })[0];
      
      if (bestTime) {
        const avgEngagement = bestTime[1].count > 0 ? bestTime[1].engagement / bestTime[1].count : 0;
        kpis.bestPostingTime = `${bestTime[0]} (متوسط تفاعل ${Math.round(avgEngagement)})`;
        kpis.peakEngagementTime = bestTime[0];
      }
    }

    // Sort posts by date (newest first)
    kpis.postsData.sort((a, b) => {
      try {
        const dateA = new Date(a.publishDate).getTime();
        const dateB = new Date(b.publishDate).getTime();
        return dateB - dateA;
      } catch {
        return 0;
      }
    });
  }

  return kpis;
}

