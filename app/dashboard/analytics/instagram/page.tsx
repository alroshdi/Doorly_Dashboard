"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { LineChartComponent } from "@/components/charts/line-chart";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { Eye, TrendingUp, Heart, MessageCircle, ExternalLink, Search, Trophy, Lightbulb } from "lucide-react";

interface InstagramPost {
  media_id: string;
  timestamp?: string;
  reach?: number;
  total_interactions?: number;
  likes?: number;
  comments?: number;
  permalink?: string;
  caption?: string;
}

interface InstagramAnalytics {
  posts: InstagramPost[];
  kpis: {
    totalReach: number;
    totalInteractions: number;
    totalLikes: number;
    totalComments: number;
    totalPosts: number;
  };
  topPosts: {
    byReach: InstagramPost[];
    byInteractions: InstagramPost[];
  };
  timeTrends: {
    last7Days: Array<{ date: string; reach: number; interactions: number; likes: number; comments: number }>;
  };
  timestamp: string;
  error?: string | null;
}

export default function InstagramAnalyticsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<InstagramAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/instagram/analytics");
      
      // Always try to parse JSON, even if response is not ok
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${response.statusText}`);
      }
      
      // Check for error in response
      if (!response.ok || result.error) {
        const errorMessage = result.error || `HTTP ${response.status}: Failed to fetch Instagram analytics`;
        setError(errorMessage);
        setData(null);
        return;
      }
      
      // Success - set data
      setData(result);
      setError("");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load Instagram analytics";
      setError(errorMessage);
      setData(null);
      console.error("Error fetching Instagram analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  // Filter posts by search term
  const filteredPosts = useMemo(() => {
    if (!data?.posts) return [];
    if (!searchTerm) return data.posts;

    const term = searchTerm.toLowerCase();
    return data.posts.filter((post) => {
      return (
        post.media_id?.toLowerCase().includes(term) ||
        post.timestamp?.toLowerCase().includes(term) ||
        post.permalink?.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  // Calculate engagement ratios
  const engagementRatios = useMemo(() => {
    if (!data?.kpis || data.kpis.totalReach === 0) {
      return {
        interactionsRatio: 0,
        likesRatio: 0,
        commentsRatio: 0,
      };
    }

    return {
      interactionsRatio: (data.kpis.totalInteractions / data.kpis.totalReach) * 100,
      likesRatio: (data.kpis.totalLikes / data.kpis.totalReach) * 100,
      commentsRatio: (data.kpis.totalComments / data.kpis.totalReach) * 100,
    };
  }, [data]);

  // Generate insights
  const insights = useMemo(() => {
    if (!data || data.posts.length === 0) return [];

    const insightsList: string[] = [];

    // Top performing post
    if (data.topPosts.byReach.length > 0) {
      const topPost = data.topPosts.byReach[0];
      insightsList.push(
        isRTL
          ? `أفضل منشور من حيث الوصول: ${topPost.reach?.toLocaleString()} وصول`
          : `Top performing post by reach: ${topPost.reach?.toLocaleString()} reach`
      );
    }

    // Engagement rate
    if (engagementRatios.interactionsRatio > 0) {
      insightsList.push(
        isRTL
          ? `معدل التفاعل: ${engagementRatios.interactionsRatio.toFixed(2)}%`
          : `Engagement rate: ${engagementRatios.interactionsRatio.toFixed(2)}%`
      );
    }

    // Average metrics per post
    if (data.kpis.totalPosts > 0) {
      const avgReach = data.kpis.totalReach / data.kpis.totalPosts;
      const avgLikes = data.kpis.totalLikes / data.kpis.totalPosts;
      insightsList.push(
        isRTL
          ? `متوسط الوصول لكل منشور: ${Math.round(avgReach).toLocaleString()}`
          : `Average reach per post: ${Math.round(avgReach).toLocaleString()}`
      );
      insightsList.push(
        isRTL
          ? `متوسط الإعجابات لكل منشور: ${Math.round(avgLikes).toLocaleString()}`
          : `Average likes per post: ${Math.round(avgLikes).toLocaleString()}`
      );
    }

    // Content performance recommendation
    if (data.topPosts.byInteractions.length > 0 && data.topPosts.byReach.length > 0) {
      const topByInteractions = data.topPosts.byInteractions[0];
      const topByReach = data.topPosts.byReach[0];
      
      if (topByInteractions.media_id === topByReach.media_id) {
        insightsList.push(
          isRTL
            ? "💡 المنشورات التي تحقق وصولاً عالياً تحقق أيضاً تفاعلاً عالياً"
            : "💡 Posts with high reach also achieve high engagement"
        );
      }
    }

    return insightsList;
  }, [data, engagementRatios, isRTL]);

  // Helper function to get first word of caption
  const getFirstWord = (caption?: string) => {
    if (!caption) return "";
    const words = caption.trim().split(/\s+/);
    return words[0] || "";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(isRTL ? "ar-DZ" : "en-US").format(Math.round(num));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return isRTL ? "غير متوفر" : "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(isRTL ? "ar-DZ" : "en-US");
    } catch {
      return dateStr;
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">
              {isRTL ? "جاري التحميل..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">
              {isRTL ? "جاري تحميل البيانات..." : "Loading analytics..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || (data && data.error)) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-4 space-y-2 md:space-y-3">
            <Card className="border border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  {isRTL ? "خطأ في تحميل البيانات" : "Error Loading Data"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  {error || data?.error || (isRTL ? "فشل تحميل بيانات الإنستجرام" : "Failed to load Instagram analytics")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRTL 
                    ? "تأكد من إعداد متغيرات البيئة (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID) وأن ورقة البيانات 'insta_insights_daily' موجودة."
                    : "Please ensure environment variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID) are set and the 'insta_insights_daily' sheet exists."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-4 space-y-2 md:space-y-3">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>
                  {isRTL ? "لا توجد بيانات" : "No Data Available"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {isRTL 
                    ? "لا توجد بيانات في ورقة Google Sheets. يرجى تشغيل سكريبت المزامنة أولاً."
                    : "No data found in Google Sheets. Please run the sync script first."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Header Section */}
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {t.sidebar.instagram}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? "تحليلات شاملة لإنستجرام" 
                : "Comprehensive Instagram Analytics"}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            <Card className="border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold">
                  {isRTL ? "إجمالي الوصول" : "Total Reach"}
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatNumber(data.kpis.totalReach)}</div>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold">
                  {isRTL ? "إجمالي التفاعلات" : "Total Interactions"}
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatNumber(data.kpis.totalInteractions)}</div>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold">
                  {isRTL ? "إجمالي الإعجابات" : "Total Likes"}
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Heart className="h-3.5 w-3.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatNumber(data.kpis.totalLikes)}</div>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold">
                  {isRTL ? "إجمالي التعليقات" : "Total Comments"}
                </CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-bold">{formatNumber(data.kpis.totalComments)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {isRTL ? "نسبة التفاعل" : "Engagement Ratio"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-primary">
                  {engagementRatios.interactionsRatio.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? "التفاعلات / الوصول" : "Interactions / Reach"}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {isRTL ? "نسبة الإعجابات" : "Likes Ratio"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-primary">
                  {engagementRatios.likesRatio.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? "الإعجابات / الوصول" : "Likes / Reach"}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {isRTL ? "نسبة التعليقات" : "Comments Ratio"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-primary">
                  {engagementRatios.commentsRatio.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? "التعليقات / الوصول" : "Comments / Reach"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {data.timeTrends.last7Days.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
              <LineChartComponent
                data={data.timeTrends.last7Days.map(d => ({
                  name: d.date,
                  value: d.reach,
                }))}
                title={isRTL ? "الوصول خلال آخر 7 أيام" : "Reach Over Last 7 Days"}
              />
              <LineChartComponent
                data={data.timeTrends.last7Days.map(d => ({
                  name: d.date,
                  value: d.interactions,
                }))}
                title={isRTL ? "التفاعلات خلال آخر 7 أيام" : "Interactions Over Last 7 Days"}
              />
            </div>
          )}

          {/* Top Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  {isRTL ? "أفضل 5 منشورات حسب الوصول" : "Top 5 Posts by Reach"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topPosts.byReach.slice(0, 5).map((post, index) => (
                    <div
                      key={post.media_id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {post.caption ? getFirstWord(post.caption) : post.media_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(post.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatNumber(post.reach || 0)}</span>
                        {post.permalink && (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" />
                  {isRTL ? "أفضل 5 منشورات حسب التفاعل" : "Top 5 Posts by Interactions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topPosts.byInteractions.slice(0, 5).map((post, index) => (
                    <div
                      key={post.media_id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {post.caption ? getFirstWord(post.caption) : post.media_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(post.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatNumber(post.total_interactions || 0)}</span>
                        {post.permalink && (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  {isRTL ? "رؤى وتحليلات" : "Insights & Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.map((insight, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card className="border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isRTL ? "جدول المنشورات" : "Posts Table"}</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isRTL ? "بحث..." : "Search..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "معرف المنشور" : "Media ID"}
                      </th>
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "التاريخ" : "Timestamp"}
                      </th>
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "الوصول" : "Reach"}
                      </th>
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "التفاعلات" : "Interactions"}
                      </th>
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "الإعجابات" : "Likes"}
                      </th>
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "التعليقات" : "Comments"}
                      </th>
                      <th className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                        {isRTL ? "الرابط" : "Link"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                          {isRTL ? "لا توجد بيانات" : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => (
                        <tr
                          key={post.media_id}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {post.media_id}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {formatDate(post.timestamp)}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {formatNumber(post.reach || 0)}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {formatNumber(post.total_interactions || 0)}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {formatNumber(post.likes || 0)}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {formatNumber(post.comments || 0)}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                            {post.permalink ? (
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 flex items-center gap-1"
                              >
                                <span>{isRTL ? "فتح" : "Open"}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
