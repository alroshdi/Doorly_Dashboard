export interface LinkedInData {
  content: Record<string, any[]>;
  visitors: Record<string, any[]>;
  followers: Record<string, any[]>;
  competitors: Record<string, any[]>;
  timestamp: string;
  sources?: {
    content?: string;
    visitors?: string;
    followers?: string;
    competitors?: string | null;
  };
  exportEpochMs?: number | null;
}

export interface LinkedInKPIs {
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  avgEngagementRate: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  totalFollowers: number;
  newFollowers: number;
  followerGrowthRate: number;
  followersByCountry: { name: string; value: number }[];
  followersByIndustry: { name: string; value: number }[];
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  visitorsByCountry: { name: string; value: number }[];
  visitorsByIndustry: { name: string; value: number }[];
  competitorComparison: { name: string; followers: number; engagement: number }[];
  impressionsOverTime: { name: string; value: number }[];
  engagementsOverTime: { name: string; value: number }[];
  followersOverTime: { name: string; value: number }[];
  visitorsBySource: { name: string; value: number }[];
  followersBySource: { name: string; value: number }[];
  avgTimeSpent: number;
  timeSpentDistribution: { name: string; value: number }[];
  engagementTimeOverTime: { name: string; value: number }[];
  topContent: { name: string; value: number }[];
  engagementByType: { name: string; value: number }[];
  reachBySource: { name: string; value: number }[];
}

function normalizeKey(key: string): string {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function firstSheetRows(
  workbook: Record<string, any[]> | undefined,
  test: (sheetName: string) => boolean
): any[] {
  if (!workbook) return [];
  const name = Object.keys(workbook).find(test);
  if (!name) return [];
  const rows = workbook[name];
  return Array.isArray(rows) ? rows : [];
}

function extractValue(obj: any, possibleKeys: string[]): number {
  if (!obj || typeof obj !== "object") return 0;

  for (const key of possibleKeys) {
    const nk = normalizeKey(key);
    const found = Object.keys(obj).find((k) => normalizeKey(k) === nk);
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
    const nk = normalizeKey(key);
    const found = Object.keys(obj).find((k) => normalizeKey(k) === nk);
    if (found) {
      const value = String(obj[found] || "").trim();
      if (value && value !== "null" && value !== "undefined") return value;
    }
  }

  return "";
}

function postEngagementTotal(post: any): number {
  const likes = extractValue(post, ["likes", "Likes", "reactions"]);
  const comments = extractValue(post, ["comments", "Comments"]);
  const shares = extractValue(post, ["reposts", "shares", "Reposts"]);
  const clicks = extractValue(post, ["clicks", "Clicks"]);
  const sum = likes + comments + shares + clicks;
  if (sum > 0) return sum;
  return extractValue(post, ["engagements", "engagement", "total_engagement"]);
}

function metricsRowEngagements(row: any): number {
  const r =
    extractValue(row, ["reactions (total)", "reactions_total", "reactions"]) +
    extractValue(row, ["comments (total)", "comments_total", "comments"]) +
    extractValue(row, ["reposts (total)", "reposts_total", "reposts", "shares"]) +
    extractValue(row, ["clicks (total)", "clicks_total", "clicks"]);
  return r;
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

  let posts = firstSheetRows(data.content, (n) => {
    const s = n.trim().toLowerCase();
    return s.includes("all") && s.includes("post");
  });
  if (posts.length === 0) {
    posts = firstSheetRows(data.content, (n) => {
      const s = n.trim().toLowerCase();
      return s.includes("post") && !s.includes("metric");
    });
  }
  const metricsRows = firstSheetRows(data.content, (n) => /^metrics$/i.test(n.trim()));

  posts.forEach((post: any) => {
    kpis.totalPosts++;
    kpis.totalImpressions += extractValue(post, [
      "impressions",
      "views",
      "reach",
      "Impressions",
    ]);
    kpis.totalEngagements += postEngagementTotal(post);
    kpis.totalLikes += extractValue(post, ["likes", "reactions", "Likes"]);
    kpis.totalComments += extractValue(post, ["comments", "Comments"]);
    kpis.totalShares += extractValue(post, ["reposts", "shares", "Reposts"]);
    kpis.totalClicks += extractValue(post, ["clicks", "Clicks"]);
  });

  if (kpis.totalImpressions > 0) {
    kpis.avgEngagementRate = (kpis.totalEngagements / kpis.totalImpressions) * 100;
  }

  const impressionsMap = new Map<string, number>();
  const engagementsMap = new Map<string, number>();

  metricsRows.forEach((row: any) => {
    const dateStr = extractStringValue(row, ["date", "Date"]);
    if (!dateStr) return;
    const period = dateStr.length >= 7 ? dateStr.substring(0, 10) : dateStr;
    const imp = extractValue(row, [
      "impressions (total)",
      "impressions_total",
      "impressions",
    ]);
    const eng = metricsRowEngagements(row);
    impressionsMap.set(period, (impressionsMap.get(period) || 0) + imp);
    engagementsMap.set(period, (engagementsMap.get(period) || 0) + eng);
  });

  kpis.impressionsOverTime = Array.from(impressionsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-24);

  kpis.engagementsOverTime = Array.from(engagementsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-24);

  kpis.engagementTimeOverTime = [...kpis.engagementsOverTime];

  const topMap = new Map<string, number>();
  posts.forEach((post: any) => {
    const title = extractStringValue(post, [
      "post title",
      "title",
      "post_title",
      "name",
      "Post title",
    ]);
    const eng = postEngagementTotal(post);
    if (title && eng > 0) {
      const short = title.length > 40 ? title.substring(0, 40) + "…" : title;
      topMap.set(short, (topMap.get(short) || 0) + eng);
    }
  });
  kpis.topContent = Array.from(topMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  kpis.engagementByType = [
    { name: "Likes", value: kpis.totalLikes },
    { name: "Comments", value: kpis.totalComments },
    { name: "Shares", value: kpis.totalShares },
    { name: "Clicks", value: kpis.totalClicks },
  ].filter((item) => item.value > 0);

  const reachSourceMap = new Map<string, number>();
  posts.forEach((post: any) => {
    const source = extractStringValue(post, ["post type", "source", "channel", "audience", "Post type"]);
    const reach = extractValue(post, ["impressions", "views", "reach"]);
    if (source && reach > 0) {
      reachSourceMap.set(source, (reachSourceMap.get(source) || 0) + reach);
    }
  });
  kpis.reachBySource = Array.from(reachSourceMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const followerLocation = firstSheetRows(data.followers, (n) => /^location$/i.test(n.trim()));
  const followerIndustry = firstSheetRows(data.followers, (n) => /^industry$/i.test(n.trim()));
  const newFollowerRows = firstSheetRows(data.followers, (n) => /new followers/i.test(n));

  let locSum = 0;
  followerLocation.forEach((f: any) => {
    const label = extractStringValue(f, ["location", "country", "region", "Location"]);
    const count = extractValue(f, ["total followers", "followers", "count", "value", "Total followers"]);
    if (label) locSum += count;
  });
  if (locSum > 0) kpis.totalFollowers = locSum;

  const countryMap = new Map<string, number>();
  followerLocation.forEach((f: any) => {
    const label = extractStringValue(f, ["location", "country", "Location"]);
    const count = extractValue(f, ["total followers", "Total followers", "followers", "count"]);
    if (label) countryMap.set(label, (countryMap.get(label) || 0) + count);
  });
  kpis.followersByCountry = Array.from(countryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const industryMap = new Map<string, number>();
  followerIndustry.forEach((f: any) => {
    const ind = extractStringValue(f, ["industry", "sector", "Industry"]);
    const count = extractValue(f, ["total followers", "Total followers", "followers", "count"]);
    if (ind) industryMap.set(ind, (industryMap.get(ind) || 0) + count);
  });
  kpis.followersByIndustry = Array.from(industryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  let newSum = 0;
  const foMap = new Map<string, number>();
  newFollowerRows.forEach((f: any) => {
    const day = extractStringValue(f, ["date", "Date"]);
    const daily = extractValue(f, ["total followers", "Total followers", "organic followers"]);
    newSum += daily;
    if (day && daily > 0) foMap.set(day, (foMap.get(day) || 0) + daily);
  });
  kpis.newFollowers = newSum;
  if (kpis.totalFollowers > 0) {
    kpis.followerGrowthRate = (kpis.newFollowers / kpis.totalFollowers) * 100;
  }

  kpis.followersOverTime = Array.from(foMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-30);

  const visitorMetrics = firstSheetRows(data.visitors, (n) => /visitor metrics/i.test(n));
  const visitorLocation = firstSheetRows(data.visitors, (n) => /^location$/i.test(n.trim()));
  const visitorIndustry = firstSheetRows(data.visitors, (n) => /^industry$/i.test(n.trim()));

  let pageViewSum = 0;
  let uniqueSum = 0;
  visitorMetrics.forEach((v: any) => {
    pageViewSum += extractValue(v, [
      "total page views (total)",
      "overview page views (total)",
      "page views",
    ]);
    uniqueSum += extractValue(v, [
      "total unique visitors (total)",
      "overview unique visitors (total)",
    ]);
  });
  kpis.pageViews = pageViewSum;
  kpis.uniqueVisitors = uniqueSum;
  kpis.totalVisitors = visitorMetrics.length;

  const vcMap = new Map<string, number>();
  visitorLocation.forEach((v: any) => {
    const label = extractStringValue(v, ["location", "country", "Location"]);
    const views = extractValue(v, ["total views", "Total views", "views", "count"]);
    if (label) vcMap.set(label, (vcMap.get(label) || 0) + views);
  });
  kpis.visitorsByCountry = Array.from(vcMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const viMap = new Map<string, number>();
  visitorIndustry.forEach((v: any) => {
    const ind = extractStringValue(v, ["industry", "Industry"]);
    const views = extractValue(v, ["total views", "Total views", "views"]);
    if (ind) viMap.set(ind, (viMap.get(ind) || 0) + views);
  });
  kpis.visitorsByIndustry = Array.from(viMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const timeSpentValues: number[] = [];
  visitorMetrics.forEach((v: any) => {
    const t = extractValue(v, ["time_spent", "duration", "avg_time", "session_duration"]);
    if (t > 0) timeSpentValues.push(t);
  });
  if (timeSpentValues.length > 0) {
    kpis.avgTimeSpent = timeSpentValues.reduce((a, b) => a + b, 0) / timeSpentValues.length;
    const timeDistributionMap = new Map<string, number>();
    timeSpentValues.forEach((time) => {
      const minutes = Math.floor(time / 60);
      let bucket = "";
      if (minutes < 1) bucket = "< 1 min";
      else if (minutes < 5) bucket = "1-5 min";
      else if (minutes < 15) bucket = "5-15 min";
      else if (minutes < 30) bucket = "15-30 min";
      else bucket = "30+ min";
      timeDistributionMap.set(bucket, (timeDistributionMap.get(bucket) || 0) + 1);
    });
    const order = ["< 1 min", "1-5 min", "5-15 min", "15-30 min", "30+ min"];
    kpis.timeSpentDistribution = Array.from(timeDistributionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  }

  const compRows: any[] = [];
  Object.values(data.competitors || {}).forEach((sheet: any) => {
    if (Array.isArray(sheet)) compRows.push(...sheet);
  });

  const competitorMap = new Map<string, { followers: number; engagement: number }>();
  compRows.forEach((c: any) => {
    const name = extractStringValue(c, ["page", "company", "name", "competitor", "Page"]);
    if (!name) return;
    const followers = extractValue(c, ["total followers", "followers", "Total Followers"]);
    const engagement = extractValue(c, [
      "total post engagements",
      "engagement",
      "Total post engagements",
    ]);
    const cur = competitorMap.get(name) || { followers: 0, engagement: 0 };
    competitorMap.set(name, {
      followers: Math.max(cur.followers, followers),
      engagement: cur.engagement + engagement,
    });
  });
  kpis.competitorComparison = Array.from(competitorMap.entries())
    .map(([name, row]) => ({ name, followers: row.followers, engagement: row.engagement }))
    .filter((item) => item.followers > 0 || item.engagement > 0)
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 12);

  return kpis;
}

export function generateLinkedInInsights(
  kpis: LinkedInKPIs,
  lang: "ar" | "en"
): { headline: string; bullets: string[] } {
  const bullets: string[] = [];

  if (kpis.totalPosts > 0) {
    if (lang === "ar") {
      bullets.push(
        `تم تحليل ${kpis.totalPosts} منشورًا: ${kpis.totalImpressions.toLocaleString("ar")} ظهور و${kpis.totalEngagements.toLocaleString("ar")} تفاعل (معدل ${kpis.avgEngagementRate.toFixed(2)}٪).`
      );
    } else {
      bullets.push(
        `Analyzed ${kpis.totalPosts} posts: ${kpis.totalImpressions.toLocaleString()} impressions and ${kpis.totalEngagements.toLocaleString()} engagements (${kpis.avgEngagementRate.toFixed(2)}% rate).`
      );
    }
  }

  if (kpis.topContent[0]) {
    if (lang === "ar") {
      bullets.push(`أقوى محتوى من حيث التفاعل: «${kpis.topContent[0].name}».`);
    } else {
      bullets.push(`Top post by engagement: "${kpis.topContent[0].name}".`);
    }
  }

  if (kpis.followersByIndustry[0]) {
    if (lang === "ar") {
      bullets.push(
        `أكبر شريحة من المتابعين حسب الصناعة: ${kpis.followersByIndustry[0].name} (${kpis.followersByIndustry[0].value}).`
      );
    } else {
      bullets.push(
        `Largest follower segment by industry: ${kpis.followersByIndustry[0].name} (${kpis.followersByIndustry[0].value}).`
      );
    }
  }

  if (kpis.followersByCountry[0]) {
    if (lang === "ar") {
      bullets.push(
        `أبرز مواقع المتابعين: ${kpis.followersByCountry[0].name} (${kpis.followersByCountry[0].value}).`
      );
    } else {
      bullets.push(
        `Top follower locations: ${kpis.followersByCountry[0].name} (${kpis.followersByCountry[0].value}).`
      );
    }
  }

  if (kpis.pageViews > 0) {
    if (lang === "ar") {
      bullets.push(
        `مشاهدات صفحة الشركة في الفترة (مجموع يومي): حوالي ${kpis.pageViews.toLocaleString("ar")} مشاهدة.`
      );
    } else {
      bullets.push(
        `Company page views in the period (sum of daily totals): about ${kpis.pageViews.toLocaleString()} views.`
      );
    }
  }

  if (kpis.newFollowers > 0 && kpis.totalFollowers > 0) {
    if (lang === "ar") {
      bullets.push(
        `نمو المتابعين في الفترة: +${kpis.newFollowers} (حوالي ${kpis.followerGrowthRate.toFixed(2)}٪ من قاعدة المتابعين المقدّرة).`
      );
    } else {
      bullets.push(
        `Follower growth in period: +${kpis.newFollowers} (~${kpis.followerGrowthRate.toFixed(2)}% vs. estimated audience base).`
      );
    }
  }

  if (kpis.competitorComparison.length > 1) {
    const sorted = [...kpis.competitorComparison].sort((a, b) => b.followers - a.followers);
    const you = sorted.find((c) => /doorly|دورلي/i.test(c.name));
    const rank = you ? sorted.findIndex((c) => c.name === you.name) + 1 : null;
    if (lang === "ar") {
      bullets.push(
        rank
          ? `ضمن مجموعة المنافسين المعروضة، صفحتك تحتل المركز ${rank} من ${sorted.length} حسب المتابعين.`
          : `مقارنة متابعة ${sorted.length} صفحة في لوحة المنافسين.`
      );
    } else {
      bullets.push(
        rank
          ? `Among listed competitors, your page ranks #${rank} of ${sorted.length} by followers.`
          : `Benchmarking ${sorted.length} pages in the competitor set.`
      );
    }
  }

  const headline =
    lang === "ar"
      ? "ملخص تنفيذي — LinkedIn"
      : "Executive summary — LinkedIn";

  return { headline, bullets: bullets.slice(0, 6) };
}
