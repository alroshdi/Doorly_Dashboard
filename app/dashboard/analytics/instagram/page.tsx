"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { InstagramKPICards } from "@/components/instagram-kpi-cards";
import { LineChartComponent } from "@/components/charts/line-chart";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { calculateInstagramKPIs, type InstagramData } from "@/lib/instagram-analytics";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstagramAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<InstagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    setMounted(true);
    const currentLang = getLanguage();
    setLang(currentLang);
    
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/instagram?t=${Date.now()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch Instagram data");
      }
      const result = await response.json();
      setData(result);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load Instagram data");
      console.error("Error fetching Instagram data:", err);
    } finally {
      setLoading(false);
    }
  };

  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  const renderContent = () => {
    if (!mounted) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <div className="absolute inset-0 h-12 w-12 mx-auto animate-ping opacity-20">
                <Loader2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-lg animate-pulse-slow">
              جاري تحميل بيانات Instagram...
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <div className="absolute inset-0 h-12 w-12 mx-auto animate-ping opacity-20">
                <Loader2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-lg animate-pulse-slow">
              {isRTL ? "جاري تحميل بيانات Instagram..." : "Loading Instagram data..."}
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      const isConfigError = error.includes("INSTAGRAM_ACCESS_TOKEN") || error.includes("environment variable");
      
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md animate-fade-in">
            <CardHeader>
              <CardTitle className="text-destructive">
                {isRTL ? "خطأ في الإعدادات" : "Configuration Error"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isConfigError ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? "لم يتم تكوين رمز الوصول إلى Instagram. يرجى إضافة متغير البيئة INSTAGRAM_ACCESS_TOKEN في إعدادات Vercel."
                      : "Instagram access token is not configured. Please add the INSTAGRAM_ACCESS_TOKEN environment variable in Vercel settings."}
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      {isRTL ? "خطوات الإعداد:" : "Setup Steps:"}
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>{isRTL ? "انتقل إلى إعدادات المشروع في Vercel" : "Go to your Vercel project settings"}</li>
                      <li>{isRTL ? "اختر Environment Variables" : "Select Environment Variables"}</li>
                      <li>{isRTL ? "أضف INSTAGRAM_ACCESS_TOKEN مع رمز الوصول الخاص بك" : "Add INSTAGRAM_ACCESS_TOKEN with your access token"}</li>
                      <li>{isRTL ? "أعد نشر المشروع" : "Redeploy the project"}</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL 
                      ? "راجع ملف INSTAGRAM_API_SETUP.md للحصول على تعليمات مفصلة."
                      : "See INSTAGRAM_API_SETUP.md for detailed instructions."}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-4">{error}</p>
              )}
              <div className="mt-4">
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full"
                >
                  {isRTL ? "إعادة المحاولة" : "Retry"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{isRTL ? "لا توجد بيانات" : "No data available"}</p>
        </div>
      );
    }

    const kpis = calculateInstagramKPIs(data);

    // Filter posts based on search query
    const filteredPosts = kpis.postsData.filter(post => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        post.caption.toLowerCase().includes(query) ||
        post.type.toLowerCase().includes(query) ||
        post.id.toLowerCase().includes(query)
      );
    });

    // Pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
          {/* Header Section */}
          <div className="mb-6 animate-slide-down">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2 animate-fade-in">
              {t.instagram.title}
            </h1>
            <p className="text-muted-foreground text-lg animate-slide-up" style={{ animationDelay: "100ms" }}>
              {t.instagram.subtitle}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <InstagramKPICards kpis={kpis} />
          </div>

          {/* Charts Section */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
            {/* Engagement Over Time */}
            {kpis.engagementOverTime.length > 0 && (
              <div className="animate-slide-in-left" style={{ animationDelay: "400ms" }}>
                <LineChartComponent 
                  data={kpis.engagementOverTime} 
                  title={t.instagram.charts.engagementOverTime} 
                />
              </div>
            )}

            {/* Content Type Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {kpis.avgEngagementByType.length > 0 && (
                <div className="animate-slide-in-left" style={{ animationDelay: "500ms" }}>
                  <BarChartComponent 
                    data={kpis.avgEngagementByType} 
                    title={t.instagram.charts.avgEngagementByType} 
                  />
                </div>
              )}
              {kpis.contentTypePerformance.length > 0 && (
                <div className="animate-slide-in-right" style={{ animationDelay: "600ms" }}>
                  <BarChartComponent 
                    data={kpis.contentTypePerformance} 
                    title={t.instagram.charts.contentTypePerformance} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Posts Performance Table */}
          <Card className="animate-scale-in" style={{ animationDelay: "700ms" }}>
            <CardHeader>
              <CardTitle className="text-xl">{t.instagram.table.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    type="text"
                    placeholder={t.instagram.table.search}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={cn(isRTL ? "pr-10" : "pl-10")}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.publishDate}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.engagementRate}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.reach}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.saves}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.comments}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.likes}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.caption}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.contentType}</th>
                      <th className="text-left p-2 text-sm font-semibold">{t.instagram.table.postId}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.map((post, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2 text-sm">{post.publishDate}</td>
                        <td className="p-2 text-sm text-green-600 font-medium">{post.engagementRate.toFixed(2)}%</td>
                        <td className="p-2 text-sm">{post.reach.toLocaleString()}</td>
                        <td className="p-2 text-sm">{post.saves.toLocaleString()}</td>
                        <td className="p-2 text-sm">{post.comments.toLocaleString()}</td>
                        <td className="p-2 text-sm">{post.likes.toLocaleString()}</td>
                        <td className="p-2 text-sm max-w-xs truncate">{post.caption}</td>
                        <td className="p-2 text-sm">{post.type}</td>
                        <td className="p-2 text-sm text-muted-foreground">...{post.id.slice(-8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {t.instagram.table.previous}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t.instagram.table.page} {currentPage} {t.instagram.table.of} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t.instagram.table.next}
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      {renderContent()}
    </div>
  );
}

