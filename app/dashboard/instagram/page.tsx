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
import { Eye, TrendingUp, Heart, MessageCircle, ExternalLink, Search, Trophy, Lightbulb, Users, Share2, Bookmark, Play, User, FileText } from "lucide-react";

interface InstagramPost {
  media_id: string;
  timestamp?: string;
  reach?: number;
  impressions?: number;
  total_interactions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  video_views?: number;
  media_type?: string;
  permalink?: string;
  caption?: string;
}

interface AvailableFields {
  followers_count: boolean;
  new_followers: boolean;
  reach: boolean;
  impressions: boolean;
  profile_visits: boolean;
  website_clicks: boolean;
  media_id: boolean;
  publish_date: boolean;
  media_type: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  saves: boolean;
  video_views: boolean;
  caption: boolean;
  permalink: boolean;
  story_views: boolean;
  story_replies: boolean;
  exits: boolean;
}

interface InstagramAnalytics {
  posts: InstagramPost[];
  availableFields: AvailableFields;
  kpis: {
    totalReach?: number;
    totalImpressions?: number;
    totalInteractions?: number;
    totalLikes?: number;
    totalComments?: number;
    totalShares?: number;
    totalSaves?: number;
    totalVideoViews?: number;
    totalPosts: number;
    followersCount?: number;
    newFollowers?: number;
    profileVisits?: number;
    websiteClicks?: number;
    totalStoryViews?: number;
    totalStoryReplies?: number;
    totalExits?: number;
  };
  topPosts: {
    byReach?: InstagramPost[];
    byImpressions?: InstagramPost[];
    byInteractions?: InstagramPost[];
    byLikes?: InstagramPost[];
    byVideoViews?: InstagramPost[];
  };
  timeTrends: {
    last7Days: Array<{
      date: string;
      reach?: number;
      impressions?: number;
      interactions?: number;
      likes?: number;
      comments?: number;
    }>;
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
        post.caption?.toLowerCase().includes(term) ||
        post.timestamp?.toLowerCase().includes(term) ||
        post.permalink?.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  // Calculate engagement ratios - only if both fields exist
  const engagementRatios = useMemo(() => {
    if (!data?.kpis || !data?.availableFields) {
      return {
        interactionsRatio: null,
        likesRatio: null,
        commentsRatio: null,
        reachToImpressions: null,
        profileToWebsite: null,
        storyCompletion: null,
      };
    }

    const ratios: any = {};

    // Interactions / Reach ratio
    if (data.availableFields.reach && data.kpis.totalReach && data.kpis.totalReach > 0 && 
        data.kpis.totalInteractions !== undefined) {
      ratios.interactionsRatio = (data.kpis.totalInteractions / data.kpis.totalReach) * 100;
    }

    // Likes / Reach ratio
    if (data.availableFields.reach && data.kpis.totalReach && data.kpis.totalReach > 0 && 
        data.kpis.totalLikes !== undefined) {
      ratios.likesRatio = (data.kpis.totalLikes / data.kpis.totalReach) * 100;
    }

    // Comments / Reach ratio
    if (data.availableFields.reach && data.kpis.totalReach && data.kpis.totalReach > 0 && 
        data.kpis.totalComments !== undefined) {
      ratios.commentsRatio = (data.kpis.totalComments / data.kpis.totalReach) * 100;
    }

    // Reach / Impressions ratio
    if (data.availableFields.reach && data.availableFields.impressions && 
        data.kpis.totalReach && data.kpis.totalImpressions && data.kpis.totalImpressions > 0) {
      ratios.reachToImpressions = (data.kpis.totalReach / data.kpis.totalImpressions) * 100;
    }

    // Profile visits / Website clicks ratio
    if (data.availableFields.profile_visits && data.availableFields.website_clicks && 
        data.kpis.profileVisits && data.kpis.websiteClicks && data.kpis.websiteClicks > 0) {
      ratios.profileToWebsite = (data.kpis.profileVisits / data.kpis.websiteClicks) * 100;
    }

    // Story completion rate (views - exits) / views
    if (data.availableFields.story_views && data.availableFields.exits && 
        data.kpis.totalStoryViews && data.kpis.totalStoryViews > 0 && 
        data.kpis.totalExits !== undefined) {
      ratios.storyCompletion = ((data.kpis.totalStoryViews - data.kpis.totalExits) / data.kpis.totalStoryViews) * 100;
    }

    return ratios;
  }, [data]);

  // Generate insights - only based on available data
  const insights = useMemo(() => {
    if (!data || data.posts.length === 0 || !data.availableFields) return [];

    const insightsList: string[] = [];

    // Top performing post by reach
    if (data.availableFields.reach && data.topPosts.byReach && data.topPosts.byReach.length > 0) {
      const topPost = data.topPosts.byReach[0];
      if (topPost.reach !== undefined && topPost.reach !== null) {
        insightsList.push(
          isRTL
            ? `أفضل منشور من حيث الوصول: ${topPost.reach.toLocaleString()} وصول`
            : `Top performing post by reach: ${topPost.reach.toLocaleString()} reach`
        );
      }
    }

    // Top performing post by impressions
    if (data.availableFields.impressions && data.topPosts.byImpressions && data.topPosts.byImpressions.length > 0) {
      const topPost = data.topPosts.byImpressions[0];
      if (topPost.impressions !== undefined && topPost.impressions !== null) {
        insightsList.push(
          isRTL
            ? `أفضل منشور من حيث المشاهدات: ${topPost.impressions.toLocaleString()} مشاهدة`
            : `Top performing post by impressions: ${topPost.impressions.toLocaleString()} impressions`
        );
      }
    }

    // Engagement rate
    if (engagementRatios.interactionsRatio !== null && engagementRatios.interactionsRatio !== undefined && typeof engagementRatios.interactionsRatio === 'number') {
      insightsList.push(
        isRTL
          ? `معدل التفاعل: ${engagementRatios.interactionsRatio.toFixed(2)}%`
          : `Engagement rate: ${engagementRatios.interactionsRatio.toFixed(2)}%`
      );
    }

    // Average metrics per post - only if data exists
    if (data.kpis.totalPosts > 0) {
      if (data.availableFields.reach && data.kpis.totalReach !== undefined) {
        const avgReach = data.kpis.totalReach / data.kpis.totalPosts;
        insightsList.push(
          isRTL
            ? `متوسط الوصول لكل منشور: ${Math.round(avgReach).toLocaleString()}`
            : `Average reach per post: ${Math.round(avgReach).toLocaleString()}`
        );
      }

      if (data.availableFields.likes && data.kpis.totalLikes !== undefined) {
        const avgLikes = data.kpis.totalLikes / data.kpis.totalPosts;
        insightsList.push(
          isRTL
            ? `متوسط الإعجابات لكل منشور: ${Math.round(avgLikes).toLocaleString()}`
            : `Average likes per post: ${Math.round(avgLikes).toLocaleString()}`
        );
      }

      if (data.availableFields.video_views && data.kpis.totalVideoViews !== undefined) {
        const avgVideoViews = data.kpis.totalVideoViews / data.kpis.totalPosts;
        insightsList.push(
          isRTL
            ? `متوسط مشاهدات الفيديو لكل منشور: ${Math.round(avgVideoViews).toLocaleString()}`
            : `Average video views per post: ${Math.round(avgVideoViews).toLocaleString()}`
        );
      }
    }

    // Content performance recommendation
    if (data.topPosts.byInteractions && data.topPosts.byReach && 
        data.topPosts.byInteractions.length > 0 && data.topPosts.byReach.length > 0) {
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

    // Follower growth insight
    if (data.availableFields.followers_count && data.availableFields.new_followers && 
        data.kpis.followersCount !== undefined && data.kpis.newFollowers !== undefined && data.kpis.newFollowers > 0 &&
        typeof data.kpis.followersCount === 'number' && typeof data.kpis.newFollowers === 'number') {
      const growthRate = (data.kpis.newFollowers / data.kpis.followersCount) * 100;
      if (typeof growthRate === 'number' && !isNaN(growthRate)) {
        insightsList.push(
          isRTL
            ? `نمو المتابعين: ${data.kpis.newFollowers.toLocaleString()} متابع جديد (${growthRate.toFixed(2)}%)`
            : `Follower growth: ${data.kpis.newFollowers.toLocaleString()} new followers (${growthRate.toFixed(2)}%)`
        );
      }
    }

    // Story completion rate
    if (engagementRatios.storyCompletion !== null && engagementRatios.storyCompletion !== undefined && typeof engagementRatios.storyCompletion === 'number') {
      insightsList.push(
        isRTL
          ? `معدل إكمال القصص: ${engagementRatios.storyCompletion.toFixed(2)}%`
          : `Story completion rate: ${engagementRatios.storyCompletion.toFixed(2)}%`
      );
    }

    return insightsList;
  }, [data, engagementRatios, isRTL]);

  // Helper function to get first sentence of caption
  const getFirstSentence = (caption?: string) => {
    if (!caption) return "";
    const trimmed = caption.trim();
    // Split by sentence endings: period, exclamation, question mark, newline, or emoji
    // Match first sentence (ending with . ! ? \n or before emoji)
    const sentenceMatch = trimmed.match(/^[^.!?\n]+[.!?\n]?/);
    if (sentenceMatch) {
      return sentenceMatch[0].trim();
    }
    // If no sentence ending found, return first 50 characters or until newline
    const firstLine = trimmed.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine;
  };

  // Determine which columns to show in table
  const tableColumns = useMemo(() => {
    if (!data?.availableFields) return [];
    const cols: Array<{ key: string; label: { ar: string; en: string }; field: keyof InstagramPost }> = [];
    
    // Always show caption if available
    if (data.availableFields.caption) {
      cols.push({ key: "caption", label: { ar: "التسمية التوضيحية", en: "Caption" }, field: "caption" });
    }
    
    // Show timestamp if available
    if (data.availableFields.publish_date) {
      cols.push({ key: "timestamp", label: { ar: "التاريخ", en: "Timestamp" }, field: "timestamp" });
    }
    
    // Show reach if available
    if (data.availableFields.reach) {
      cols.push({ key: "reach", label: { ar: "الوصول", en: "Reach" }, field: "reach" });
    }
    
    // Show impressions if available
    if (data.availableFields.impressions) {
      cols.push({ key: "impressions", label: { ar: "المشاهدات", en: "Impressions" }, field: "impressions" });
    }
    
    // Show interactions if components exist
    if (data.availableFields.likes || data.availableFields.comments || data.availableFields.shares) {
      cols.push({ key: "interactions", label: { ar: "التفاعلات", en: "Interactions" }, field: "total_interactions" });
    }
    
    // Show likes if available
    if (data.availableFields.likes) {
      cols.push({ key: "likes", label: { ar: "الإعجابات", en: "Likes" }, field: "likes" });
    }
    
    // Show comments if available
    if (data.availableFields.comments) {
      cols.push({ key: "comments", label: { ar: "التعليقات", en: "Comments" }, field: "comments" });
    }
    
    // Show shares if available
    if (data.availableFields.shares) {
      cols.push({ key: "shares", label: { ar: "المشاركات", en: "Shares" }, field: "shares" });
    }
    
    // Show saves if available
    if (data.availableFields.saves) {
      cols.push({ key: "saves", label: { ar: "الحفظ", en: "Saves" }, field: "saves" });
    }
    
    // Show video views if available
    if (data.availableFields.video_views) {
      cols.push({ key: "video_views", label: { ar: "مشاهدات الفيديو", en: "Video Views" }, field: "video_views" });
    }
    
    // Show permalink if available
    if (data.availableFields.permalink) {
      cols.push({ key: "permalink", label: { ar: "الرابط", en: "Link" }, field: "permalink" });
    }
    
    return cols;
  }, [data]);

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

          {/* KPI Cards - Only show if data exists */}
          {data.availableFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              {/* Account-level KPIs */}
              {data.availableFields.followers_count && data.kpis.followersCount !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "عدد المتابعين" : "Followers"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.followersCount)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.new_followers && data.kpis.newFollowers !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "متابعون جدد" : "New Followers"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.newFollowers)}</div>
                  </CardContent>
                </Card>
              )}

              {/* Post-level KPIs */}
              {data.availableFields.reach && data.kpis.totalReach !== undefined && (
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
              )}

              {data.availableFields.impressions && data.kpis.totalImpressions !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "إجمالي المشاهدات" : "Total Impressions"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalImpressions)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.likes && data.availableFields.comments && data.availableFields.shares && 
               data.kpis.totalInteractions !== undefined && (
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
              )}

              {data.availableFields.likes && data.kpis.totalLikes !== undefined && (
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
              )}

              {data.availableFields.comments && data.kpis.totalComments !== undefined && (
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
              )}

              {data.availableFields.shares && data.kpis.totalShares !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "إجمالي المشاركات" : "Total Shares"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Share2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalShares)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.saves && data.kpis.totalSaves !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "إجمالي الحفظ" : "Total Saves"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Bookmark className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalSaves)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.video_views && data.kpis.totalVideoViews !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "مشاهدات الفيديو" : "Video Views"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Play className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalVideoViews)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.profile_visits && data.kpis.profileVisits !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "زيارات الملف الشخصي" : "Profile Visits"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.profileVisits)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.website_clicks && data.kpis.websiteClicks !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "نقرات الموقع" : "Website Clicks"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.websiteClicks)}</div>
                  </CardContent>
                </Card>
              )}

              {/* Stories KPIs */}
              {data.availableFields.story_views && data.kpis.totalStoryViews !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "مشاهدات القصص" : "Story Views"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalStoryViews)}</div>
                  </CardContent>
                </Card>
              )}

              {data.availableFields.story_replies && data.kpis.totalStoryReplies !== undefined && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "ردود القصص" : "Story Replies"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <MessageCircle className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalStoryReplies)}</div>
                  </CardContent>
                </Card>
              )}

              {/* Total Posts - Always show if we have posts */}
              {data.kpis.totalPosts > 0 && (
                <Card className="border border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold">
                      {isRTL ? "إجمالي المنشورات" : "Total Posts"}
                    </CardTitle>
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{formatNumber(data.kpis.totalPosts)}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Engagement Ratios - Only show if data exists */}
          {(engagementRatios.interactionsRatio !== null || 
            engagementRatios.likesRatio !== null || 
            engagementRatios.commentsRatio !== null ||
            engagementRatios.reachToImpressions !== null ||
            engagementRatios.profileToWebsite !== null ||
            engagementRatios.storyCompletion !== null) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              {engagementRatios.interactionsRatio !== null && engagementRatios.interactionsRatio !== undefined && (
                <Card className="border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {isRTL ? "نسبة التفاعل" : "Engagement Ratio"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">
                      {typeof engagementRatios.interactionsRatio === 'number' ? engagementRatios.interactionsRatio.toFixed(2) : '0.00'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "التفاعلات / الوصول" : "Interactions / Reach"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {engagementRatios.likesRatio !== null && engagementRatios.likesRatio !== undefined && (
                <Card className="border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {isRTL ? "نسبة الإعجابات" : "Likes Ratio"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">
                      {typeof engagementRatios.likesRatio === 'number' ? engagementRatios.likesRatio.toFixed(2) : '0.00'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "الإعجابات / الوصول" : "Likes / Reach"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {engagementRatios.commentsRatio !== null && engagementRatios.commentsRatio !== undefined && (
                <Card className="border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {isRTL ? "نسبة التعليقات" : "Comments Ratio"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">
                      {typeof engagementRatios.commentsRatio === 'number' ? engagementRatios.commentsRatio.toFixed(2) : '0.00'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "التعليقات / الوصول" : "Comments / Reach"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {engagementRatios.reachToImpressions !== null && engagementRatios.reachToImpressions !== undefined && (
                <Card className="border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {isRTL ? "الوصول / المشاهدات" : "Reach / Impressions"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">
                      {typeof engagementRatios.reachToImpressions === 'number' ? engagementRatios.reachToImpressions.toFixed(2) : '0.00'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "نسبة الوصول من المشاهدات" : "Reach rate"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {engagementRatios.profileToWebsite !== null && engagementRatios.profileToWebsite !== undefined && (
                <Card className="border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {isRTL ? "الملف الشخصي / الموقع" : "Profile / Website"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">
                      {typeof engagementRatios.profileToWebsite === 'number' ? engagementRatios.profileToWebsite.toFixed(2) : '0.00'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "نسبة التحويل من الملف الشخصي" : "Conversion rate"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {engagementRatios.storyCompletion !== null && engagementRatios.storyCompletion !== undefined && (
                <Card className="border border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {isRTL ? "معدل إكمال القصص" : "Story Completion"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary">
                      {typeof engagementRatios.storyCompletion === 'number' ? engagementRatios.storyCompletion.toFixed(2) : '0.00'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "معدل إكمال مشاهدة القصص" : "Story completion rate"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Charts - Only show if data exists */}
          {data.timeTrends.last7Days.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
              {data.availableFields.reach && data.timeTrends.last7Days.some(d => d.reach !== undefined && d.reach !== null) && (
                <LineChartComponent
                  data={data.timeTrends.last7Days
                    .filter(d => d.reach !== undefined && d.reach !== null)
                    .map(d => ({
                      name: d.date,
                      value: d.reach!,
                    }))}
                  title={isRTL ? "الوصول خلال آخر 7 أيام" : "Reach Over Last 7 Days"}
                />
              )}
              {data.availableFields.impressions && data.timeTrends.last7Days.some(d => d.impressions !== undefined && d.impressions !== null) && (
                <LineChartComponent
                  data={data.timeTrends.last7Days
                    .filter(d => d.impressions !== undefined && d.impressions !== null)
                    .map(d => ({
                      name: d.date,
                      value: d.impressions!,
                    }))}
                  title={isRTL ? "المشاهدات خلال آخر 7 أيام" : "Impressions Over Last 7 Days"}
                />
              )}
              {data.availableFields.likes && data.availableFields.comments && data.availableFields.shares && 
               data.timeTrends.last7Days.some(d => d.interactions !== undefined && d.interactions !== null) && (
                <LineChartComponent
                  data={data.timeTrends.last7Days
                    .filter(d => d.interactions !== undefined && d.interactions !== null)
                    .map(d => ({
                      name: d.date,
                      value: d.interactions!,
                    }))}
                  title={isRTL ? "التفاعلات خلال آخر 7 أيام" : "Interactions Over Last 7 Days"}
                />
              )}
              {data.availableFields.likes && data.timeTrends.last7Days.some(d => d.likes !== undefined && d.likes !== null) && (
                <LineChartComponent
                  data={data.timeTrends.last7Days
                    .filter(d => d.likes !== undefined && d.likes !== null)
                    .map(d => ({
                      name: d.date,
                      value: d.likes!,
                    }))}
                  title={isRTL ? "الإعجابات خلال آخر 7 أيام" : "Likes Over Last 7 Days"}
                />
              )}
              {data.availableFields.comments && data.timeTrends.last7Days.some(d => d.comments !== undefined && d.comments !== null) && (
                <LineChartComponent
                  data={data.timeTrends.last7Days
                    .filter(d => d.comments !== undefined && d.comments !== null)
                    .map(d => ({
                      name: d.date,
                      value: d.comments!,
                    }))}
                  title={isRTL ? "التعليقات خلال آخر 7 أيام" : "Comments Over Last 7 Days"}
                />
              )}
            </div>
          )}

          {/* Top Posts - Only show if data exists */}
          {(data.topPosts.byReach && data.topPosts.byReach.length > 0) ||
           (data.topPosts.byImpressions && data.topPosts.byImpressions.length > 0) ||
           (data.topPosts.byInteractions && data.topPosts.byInteractions.length > 0) ||
           (data.topPosts.byLikes && data.topPosts.byLikes.length > 0) ||
           (data.topPosts.byVideoViews && data.topPosts.byVideoViews.length > 0) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-3">
              {data.topPosts.byReach && data.topPosts.byReach.length > 0 && (
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
                                {post.caption ? getFirstSentence(post.caption) : post.media_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(post.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.reach !== undefined && post.reach !== null && (
                              <span className="text-sm font-semibold">{formatNumber(post.reach)}</span>
                            )}
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
              )}

              {data.topPosts.byImpressions && data.topPosts.byImpressions.length > 0 && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-500" />
                      {isRTL ? "أفضل 5 منشورات حسب المشاهدات" : "Top 5 Posts by Impressions"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.topPosts.byImpressions.slice(0, 5).map((post, index) => (
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
                                {post.caption ? getFirstSentence(post.caption) : post.media_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(post.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.impressions !== undefined && post.impressions !== null && (
                              <span className="text-sm font-semibold">{formatNumber(post.impressions)}</span>
                            )}
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
              )}

              {data.topPosts.byInteractions && data.topPosts.byInteractions.length > 0 && (
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
                                {post.caption ? getFirstSentence(post.caption) : post.media_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(post.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.total_interactions !== undefined && post.total_interactions !== null && (
                              <span className="text-sm font-semibold">{formatNumber(post.total_interactions)}</span>
                            )}
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
              )}

              {data.topPosts.byLikes && data.topPosts.byLikes.length > 0 && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-red-500" />
                      {isRTL ? "أفضل 5 منشورات حسب الإعجابات" : "Top 5 Posts by Likes"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.topPosts.byLikes.slice(0, 5).map((post, index) => (
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
                                {post.caption ? getFirstSentence(post.caption) : post.media_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(post.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.likes !== undefined && post.likes !== null && (
                              <span className="text-sm font-semibold">{formatNumber(post.likes)}</span>
                            )}
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
              )}

              {data.topPosts.byVideoViews && data.topPosts.byVideoViews.length > 0 && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-500" />
                      {isRTL ? "أفضل 5 فيديوهات حسب المشاهدات" : "Top 5 Videos by Views"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.topPosts.byVideoViews.slice(0, 5).map((post, index) => (
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
                                {post.caption ? getFirstSentence(post.caption) : post.media_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(post.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.video_views !== undefined && post.video_views !== null && (
                              <span className="text-sm font-semibold">{formatNumber(post.video_views)}</span>
                            )}
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
              )}
            </div>
          ) : null}

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

          {/* Data Table - Only show columns that exist */}
          {tableColumns.length > 0 && (
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
                        {tableColumns.map((col) => (
                          <th key={col.key} className={`text-sm font-semibold p-3 ${isRTL ? "text-right" : "text-left"}`}>
                            {isRTL ? col.label.ar : col.label.en}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPosts.length === 0 ? (
                        <tr>
                          <td colSpan={tableColumns.length} className="text-center p-8 text-muted-foreground">
                            {isRTL ? "لا توجد بيانات" : "No data available"}
                          </td>
                        </tr>
                      ) : (
                        filteredPosts.map((post) => (
                          <tr
                            key={post.media_id}
                            className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            {tableColumns.map((col) => {
                              const value = post[col.field];
                              return (
                                <td key={col.key} className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                                  {col.key === "caption" ? (
                                    post.caption ? getFirstSentence(post.caption) : post.media_id
                                  ) : col.key === "timestamp" ? (
                                    formatDate(post.timestamp)
                                  ) : col.key === "permalink" ? (
                                    post.permalink ? (
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
                                    )
                                  ) : typeof value === "number" && value !== null && value !== undefined ? (
                                    formatNumber(value)
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

