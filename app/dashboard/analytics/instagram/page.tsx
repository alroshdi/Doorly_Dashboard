"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { InstagramFilters, InstagramFilterState } from "@/components/instagram-filters";
import { LineChartComponent } from "@/components/charts/line-chart";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { ScatterChartComponent } from "@/components/charts/scatter-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";
import {
  calculateInstagramKPIs,
  getEngagementOverTime,
  getContentTypePerformance,
  getBestPostingTime,
  getReachVsEngagement,
  getInstagramPosts,
  type InstagramData,
} from "@/lib/analytics";
import { Loader2, RefreshCw, Search, TrendingUp, TrendingDown, Clock, Image as ImageIcon, Video, Film } from "lucide-react";
import { parseISO, isWithinInterval, format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";

export default function InstagramAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<InstagramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [filters, setFilters] = useState<InstagramFilterState>({
    startDate: "",
    endDate: "",
    quickFilter: "",
    contentType: "",
    minEngagement: "",
    sortBy: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const postsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError("");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const url = forceRefresh ? "/api/instagram?refresh=true" : "/api/instagram";
      
      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error("Request timeout. Please try again.");
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch Instagram data");
      }
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(Array.isArray(result) ? result : []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load Instagram data");
      console.error("Error fetching Instagram data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (!data || data.length === 0) return [];

    // Date range filter
    if (filters.startDate || filters.endDate) {
      const timestampColumn = Object.keys(data[0] || {}).find(k => 
        k.toLowerCase().includes("timestamp") || 
        k.toLowerCase().includes("created_time") || 
        k.toLowerCase().includes("date") ||
        k.toLowerCase().includes("post_date")
      );
      
      if (timestampColumn) {
        filtered = filtered.filter((row) => {
          const dateStr = String(row[timestampColumn] || "");
          if (!dateStr) return false;
          
          try {
            const rowDate = parseISO(dateStr);
            if (isNaN(rowDate.getTime())) return false;
            
            if (filters.startDate) {
              const startDate = parseISO(filters.startDate);
              if (rowDate < startDate) return false;
            }
            
            if (filters.endDate) {
              const endDate = parseISO(filters.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (rowDate > endDate) return false;
            }
            
            return true;
          } catch {
            return false;
          }
        });
      }
    }

    // Content type filter
    if (filters.contentType) {
      const mediaTypeColumn = Object.keys(data[0] || {}).find(k => 
        k.toLowerCase().includes("media_type") || 
        k.toLowerCase().includes("type") || 
        k.toLowerCase().includes("content_type")
      );
      
      if (mediaTypeColumn) {
        filtered = filtered.filter((row) => {
          const type = String(row[mediaTypeColumn] || "").trim().toUpperCase();
          return type === filters.contentType.toUpperCase();
        });
      }
    }

    // Min engagement filter
    if (filters.minEngagement) {
      const minEngagement = Number(filters.minEngagement);
      if (!isNaN(minEngagement)) {
        const likesColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("likes") || k.toLowerCase().includes("like_count")
        );
        const commentsColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("comments") || k.toLowerCase().includes("comment_count")
        );
        const savesColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("saves") || k.toLowerCase().includes("save_count")
        );
        
        filtered = filtered.filter((row) => {
          const likes = Number(row[likesColumn || ""] || 0);
          const comments = Number(row[commentsColumn || ""] || 0);
          const saves = Number(row[savesColumn || ""] || 0);
          const engagement = likes + comments + saves;
          return engagement >= minEngagement;
        });
      }
    }

    // Sort
    if (filters.sortBy) {
      if (filters.sortBy === "engagement") {
        const likesColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("likes") || k.toLowerCase().includes("like_count")
        );
        const commentsColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("comments") || k.toLowerCase().includes("comment_count")
        );
        const savesColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("saves") || k.toLowerCase().includes("save_count")
        );
        
        filtered.sort((a, b) => {
          const engagementA = 
            Number(a[likesColumn || ""] || 0) + 
            Number(a[commentsColumn || ""] || 0) + 
            Number(a[savesColumn || ""] || 0);
          const engagementB = 
            Number(b[likesColumn || ""] || 0) + 
            Number(b[commentsColumn || ""] || 0) + 
            Number(b[savesColumn || ""] || 0);
          return engagementB - engagementA;
        });
      } else if (filters.sortBy === "reach") {
        const reachColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("reach") || k.toLowerCase().includes("impressions")
        );
        filtered.sort((a, b) => {
          const reachA = Number(a[reachColumn || ""] || 0);
          const reachB = Number(b[reachColumn || ""] || 0);
          return reachB - reachA;
        });
      } else if (filters.sortBy === "date") {
        const timestampColumn = Object.keys(data[0] || {}).find(k => 
          k.toLowerCase().includes("timestamp") || 
          k.toLowerCase().includes("created_time") || 
          k.toLowerCase().includes("date")
        );
        if (timestampColumn) {
          filtered.sort((a, b) => {
            const dateA = new Date(String(a[timestampColumn] || "")).getTime();
            const dateB = new Date(String(b[timestampColumn] || "")).getTime();
            return dateB - dateA;
          });
        }
      }
    }

    return filtered;
  }, [data, filters]);

  const kpis = useMemo(() => calculateInstagramKPIs(filteredData), [filteredData]);
  const engagementOverTime = useMemo(() => getEngagementOverTime(filteredData, timePeriod), [filteredData, timePeriod]);
  const contentTypePerformance = useMemo(() => getContentTypePerformance(filteredData), [filteredData]);
  const bestPostingTime = useMemo(() => getBestPostingTime(filteredData), [filteredData]);
  const reachVsEngagement = useMemo(() => getReachVsEngagement(filteredData), [filteredData]);
  const posts = useMemo(() => getInstagramPosts(filteredData), [filteredData]);

  // Smart Insights calculations (must be before early returns)
  const bestDay = useMemo(() => {
    const dayStats: { [day: string]: number } = {};
    filteredData.forEach((row) => {
      const timestampColumn = Object.keys(row || {}).find(k => 
        k.toLowerCase().includes("timestamp") || 
        k.toLowerCase().includes("created_time") || 
        k.toLowerCase().includes("date")
      );
      if (timestampColumn) {
        try {
          const date = parseISO(String(row[timestampColumn] || ""));
          if (!isNaN(date.getTime())) {
            const day = formatDate(date, "EEEE");
            const likes = Number(row[Object.keys(row).find(k => k.toLowerCase().includes("likes")) || ""] || 0);
            const comments = Number(row[Object.keys(row).find(k => k.toLowerCase().includes("comments")) || ""] || 0);
            const saves = Number(row[Object.keys(row).find(k => k.toLowerCase().includes("saves")) || ""] || 0);
            dayStats[day] = (dayStats[day] || 0) + likes + comments + saves;
          }
        } catch {}
      }
    });
    return Object.entries(dayStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "غير متوفر";
  }, [filteredData]);

  // Filter posts by search term
  const filteredPosts = useMemo(() => {
    let result = [...posts];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((post) => 
        post.caption.toLowerCase().includes(term) ||
        post.mediaId.toLowerCase().includes(term)
      );
    }

    // Table sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn as keyof typeof a];
        const bVal = b[sortColumn as keyof typeof b];
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal || "");
        const bStr = String(bVal || "");
        return sortDirection === "asc" 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [posts, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  // Smart Insights
  const topPost = posts.length > 0 
    ? posts.reduce((max, post) => {
        const engagement = post.likes + post.comments + post.saves;
        const maxEngagement = max.likes + max.comments + max.saves;
        return engagement > maxEngagement ? post : max;
      }, posts[0])
    : null;

  const bestContentType = contentTypePerformance.length > 0 ? contentTypePerformance[0] : null;
  const lowPerformingPosts = posts
    .filter(post => {
      const engagement = post.likes + post.comments + post.saves;
      const avgEngagement = kpis.avgEngagementPerPost;
      return engagement < avgEngagement * 0.5; // Less than 50% of average
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 overflow-y-auto lg:ml-0">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                {isRTL ? "جاري التحميل..." : "Loading..."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isRTL ? "تحديث البيانات" : "Refresh Data"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 overflow-y-auto lg:ml-0">
          <div className="flex items-center justify-center h-full">
            <Card className="p-6">
              <CardContent>
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => fetchData(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isRTL ? "إعادة المحاولة" : "Retry"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 lg:pt-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isRTL ? "تحليل مواقع التواصل" : "Social Media Analytics"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isRTL ? "تحليل أداء محتوى إنستغرام وفهم سلوك التفاعل والوصول" : "Analyze Instagram content performance and understand engagement and reach behavior"}
            </p>
          </div>

          {/* Filters */}
          <InstagramFilters filters={filters} onFiltersChange={setFilters} data={data} />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <Card className="animate-fade-in">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {isRTL ? "إجمالي المنشورات" : "Total Posts"}
                </div>
                <div className="text-2xl font-bold">{kpis.totalPosts}</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {isRTL ? "إجمالي التفاعل" : "Total Engagement"}
                </div>
                <div className="text-2xl font-bold">{kpis.totalEngagement.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {isRTL ? "معدل التفاعل" : "Engagement Rate"}
                </div>
                <div className="text-2xl font-bold">{kpis.engagementRate.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {isRTL ? "إجمالي الوصول" : "Total Reach"}
                </div>
                <div className="text-2xl font-bold">{kpis.totalReach.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: "400ms" }}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {isRTL ? "متوسط التفاعل" : "Avg Engagement"}
                </div>
                <div className="text-2xl font-bold">{Math.round(kpis.avgEngagementPerPost).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: "500ms" }}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {isRTL ? "أفضل وقت للنشر" : "Best Posting Time"}
                </div>
                <div className="text-2xl font-bold">{kpis.bestPostingTime}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="space-y-4">
            {/* Engagement Over Time */}
            {engagementOverTime.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {isRTL ? "التفاعل عبر الزمن" : "Engagement Over Time"}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant={timePeriod === "daily" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimePeriod("daily")}
                    >
                      {isRTL ? "يومي" : "Daily"}
                    </Button>
                    <Button
                      variant={timePeriod === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimePeriod("weekly")}
                    >
                      {isRTL ? "أسبوعي" : "Weekly"}
                    </Button>
                    <Button
                      variant={timePeriod === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimePeriod("monthly")}
                    >
                      {isRTL ? "شهري" : "Monthly"}
                    </Button>
                  </div>
                </div>
                <LineChartComponent 
                  data={engagementOverTime} 
                  title={isRTL ? "التفاعل عبر الزمن" : "Engagement Over Time"}
                />
              </div>
            )}

            {/* Content Type Performance and Best Posting Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {contentTypePerformance.length > 0 && (
                <BarChartComponent 
                  data={contentTypePerformance} 
                  title={isRTL ? "أداء أنواع المحتوى" : "Content Type Performance"}
                />
              )}
              {bestPostingTime.length > 0 && (
                <BarChartComponent 
                  data={bestPostingTime} 
                  title={isRTL ? "أفضل وقت للنشر" : "Best Posting Time"}
                />
              )}
            </div>

            {/* Reach vs Engagement */}
            {reachVsEngagement.length > 0 && (
              <ScatterChartComponent 
                data={reachVsEngagement} 
                title={isRTL ? "الوصول مقابل التفاعل" : "Reach vs Engagement"}
                description={isRTL ? "تحليل العلاقة بين الوصول والتفاعل" : "Analyze the relationship between reach and engagement"}
              />
            )}
          </div>

          {/* Smart Insights */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold">
              {isRTL ? "رؤى ذكية" : "Smart Insights"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{isRTL ? "أفضل منشور" : "Top Post"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPost ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground truncate">{topPost.caption}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {topPost.likes + topPost.comments + topPost.saves} {isRTL ? "تفاعل" : "engagement"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{isRTL ? "غير متوفر" : "N/A"}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{isRTL ? "أفضل يوم" : "Best Day"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">{bestDay}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{isRTL ? "أفضل نوع محتوى" : "Best Content Type"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {bestContentType ? (
                    <div>
                      <p className="text-lg font-bold">{bestContentType.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {bestContentType.value.toFixed(2)}% {isRTL ? "معدل تفاعل" : "engagement rate"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{isRTL ? "غير متوفر" : "N/A"}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{isRTL ? "منشورات ضعيفة" : "Low Performing"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">{lowPerformingPosts.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "منشورات تحت المتوسط" : "posts below average"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "توصيات قابلة للتنفيذ" : "Actionable Recommendations"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bestContentType && bestContentType.name.includes("ريل") && (
                <div className="flex items-start gap-2 p-2 bg-primary/10 rounded">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
                  <p className="text-sm">
                    {isRTL 
                      ? "الريلز تحقق أداءً أفضل. يُنصح بزيادة تكرار نشر الريلز."
                      : "Reels are performing better. Consider increasing Reels posting frequency."}
                  </p>
                </div>
              )}
              {kpis.bestPostingTime !== "غير متوفر" && (
                <div className="flex items-start gap-2 p-2 bg-primary/10 rounded">
                  <Clock className="h-4 w-4 mt-0.5 text-primary" />
                  <p className="text-sm">
                    {isRTL 
                      ? `أفضل وقت للنشر هو ${kpis.bestPostingTime}. يُنصح بالنشر في هذا الوقت.`
                      : `Best posting time is ${kpis.bestPostingTime}. Consider posting at this time.`}
                  </p>
                </div>
              )}
              {lowPerformingPosts.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded">
                  <TrendingDown className="h-4 w-4 mt-0.5 text-amber-500" />
                  <p className="text-sm">
                    {isRTL 
                      ? `${lowPerformingPosts.length} منشورات بأداء منخفض. يُنصح بمراجعة المحتوى والكابشن.`
                      : `${lowPerformingPosts.length} posts with low performance. Consider reviewing content and captions.`}
                  </p>
                </div>
              )}
              {topPost && (
                <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-green-500" />
                  <p className="text-sm">
                    {isRTL 
                      ? "يُنصح بإعادة نشر المحتوى الأفضل أداءً أو إنشاء محتوى مشابه."
                      : "Consider reposting top-performing content or creating similar content."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts Performance Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isRTL ? "جدول أداء المنشورات" : "Posts Performance Table"}</CardTitle>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("mediaId")}
                      >
                        {isRTL ? "معرف المنشور" : "Media ID"}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("contentType")}
                      >
                        {isRTL ? "نوع المحتوى" : "Content Type"}
                      </th>
                      <th className="text-left p-2">{isRTL ? "الكابشن" : "Caption"}</th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("likes")}
                      >
                        {isRTL ? "إعجابات" : "Likes"}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("comments")}
                      >
                        {isRTL ? "تعليقات" : "Comments"}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("saves")}
                      >
                        {isRTL ? "حفظ" : "Saves"}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("reach")}
                      >
                        {isRTL ? "الوصول" : "Reach"}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("engagementRate")}
                      >
                        {isRTL ? "معدل التفاعل" : "Engagement Rate"}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort("postDate")}
                      >
                        {isRTL ? "تاريخ النشر" : "Post Date"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center p-4 text-muted-foreground">
                          {isRTL ? "لا توجد بيانات" : "No data"}
                        </td>
                      </tr>
                    ) : (
                      paginatedPosts.map((post, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{post.mediaId.substring(0, 8)}...</td>
                          <td className="p-2">
                            <Badge variant="outline">
                              {post.contentType === "IMAGE" ? (isRTL ? "صورة" : "Image") :
                               post.contentType === "VIDEO" ? (isRTL ? "فيديو" : "Video") :
                               post.contentType === "REEL" ? (isRTL ? "ريل" : "Reel") : post.contentType}
                            </Badge>
                          </td>
                          <td className="p-2 max-w-xs truncate" title={post.caption}>
                            {post.caption || "-"}
                          </td>
                          <td className="p-2">{post.likes.toLocaleString()}</td>
                          <td className="p-2">{post.comments.toLocaleString()}</td>
                          <td className="p-2">{post.saves.toLocaleString()}</td>
                          <td className="p-2">{post.reach.toLocaleString()}</td>
                          <td className="p-2">{post.engagementRate}%</td>
                          <td className="p-2 text-xs">
                            {post.postDate ? formatDate(parseISO(post.postDate), "yyyy-MM-dd") : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {isRTL 
                      ? `صفحة ${currentPage} من ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {isRTL ? "السابق" : "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {isRTL ? "التالي" : "Next"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

