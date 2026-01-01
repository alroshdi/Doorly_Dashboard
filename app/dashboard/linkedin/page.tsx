"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { LinkedInKPICards } from "@/components/linkedin-kpi-cards";
import { LineChartComponent } from "@/components/charts/line-chart";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { PieChartComponent } from "@/components/charts/pie-chart";
import { DonutChartComponent } from "@/components/charts/donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { calculateLinkedInKPIs, type LinkedInData } from "@/lib/linkedin-analytics";
import { Loader2 } from "lucide-react";

export default function LinkedInInsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<LinkedInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [mounted, setMounted] = useState(false);

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
      const response = await fetch("/api/linkedin");
      if (!response.ok) {
        throw new Error("Failed to fetch LinkedIn data");
      }
      const result = await response.json();
      setData(result);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load LinkedIn data");
      console.error("Error fetching LinkedIn data:", err);
    } finally {
      setLoading(false);
    }
  };

  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  // Always show sidebar for navigation
  const renderContent = () => {
    // Prevent hydration mismatch by using consistent text until mounted
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
              جاري تحميل بيانات LinkedIn...
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
              {isRTL ? "جاري تحميل بيانات LinkedIn..." : "Loading LinkedIn data..."}
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
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md animate-fade-in">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </button>
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

    const kpis = calculateLinkedInKPIs(data);

    return (
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in pt-16 lg:pt-6">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 animate-slide-down">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2 animate-fade-in">
              {t.linkedin.title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg animate-slide-up" style={{ animationDelay: "100ms" }}>
              {t.linkedin.subtitle}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <LinkedInKPICards kpis={kpis} />
          </div>

          {/* Charts Section */}
          <div className="space-y-4 sm:space-y-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
            {/* Time-based Charts - Only show if data exists */}
            {kpis.impressionsOverTime.length > 0 || kpis.engagementsOverTime.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {kpis.impressionsOverTime.length > 0 && (
                  <div className="animate-slide-in-left" style={{ animationDelay: "400ms" }}>
                    <LineChartComponent 
                      data={kpis.impressionsOverTime} 
                      title={t.linkedin.charts.impressionsOverTime} 
                    />
                  </div>
                )}
                {kpis.engagementsOverTime.length > 0 && (
                  <div className="animate-slide-in-right" style={{ animationDelay: "500ms" }}>
                    <LineChartComponent 
                      data={kpis.engagementsOverTime} 
                      title={t.linkedin.charts.engagementsOverTime} 
                    />
                  </div>
                )}
              </div>
            ) : null}

            {/* Followers Distribution - Only show if data exists */}
            {(kpis.followersByCountry.length > 0 || kpis.followersByIndustry.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {kpis.followersByCountry.length > 0 && (
                  <div className="animate-slide-in-left" style={{ animationDelay: "600ms" }}>
                    <DonutChartComponent 
                      data={kpis.followersByCountry} 
                      title={t.linkedin.charts.followersByCountry} 
                    />
                  </div>
                )}
                {kpis.followersByIndustry.length > 0 && (
                  <div className="animate-slide-in-right" style={{ animationDelay: "700ms" }}>
                    <PieChartComponent 
                      data={kpis.followersByIndustry} 
                      title={t.linkedin.charts.followersByIndustry} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Visitors Distribution - Only show if data exists */}
            {(kpis.visitorsByCountry.length > 0 || kpis.visitorsByIndustry.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {kpis.visitorsByCountry.length > 0 && (
                  <div className="animate-slide-in-left" style={{ animationDelay: "800ms" }}>
                    <BarChartComponent 
                      data={kpis.visitorsByCountry} 
                      title={t.linkedin.charts.visitorsByCountry} 
                    />
                  </div>
                )}
                {kpis.visitorsByIndustry.length > 0 && (
                  <div className="animate-slide-in-right" style={{ animationDelay: "900ms" }}>
                    <BarChartComponent 
                      data={kpis.visitorsByIndustry} 
                      title={t.linkedin.charts.visitorsByIndustry} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Competitor Comparison */}
            {kpis.competitorComparison.length > 0 && (
              <div className="animate-scale-in" style={{ animationDelay: "1000ms" }}>
                <BarChartComponent 
                  data={kpis.competitorComparison.map(c => ({ name: c.name, value: c.followers }))} 
                  title={t.linkedin.charts.competitorComparison} 
                />
              </div>
            )}

            {/* User Sources - Where users come from */}
            {(kpis.visitorsBySource.length > 0 || kpis.followersBySource.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {kpis.visitorsBySource.length > 0 && (
                  <div className="animate-slide-in-left" style={{ animationDelay: "1100ms" }}>
                    <PieChartComponent 
                      data={kpis.visitorsBySource} 
                      title={t.linkedin.charts.visitorsBySource} 
                    />
                  </div>
                )}
                {kpis.followersBySource.length > 0 && (
                  <div className="animate-slide-in-right" style={{ animationDelay: "1200ms" }}>
                    <DonutChartComponent 
                      data={kpis.followersBySource} 
                      title={t.linkedin.charts.followersBySource} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Time Spent Metrics */}
            {(kpis.timeSpentDistribution.length > 0 || kpis.engagementTimeOverTime.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {kpis.timeSpentDistribution.length > 0 && (
                  <div className="animate-slide-in-left" style={{ animationDelay: "1300ms" }}>
                    <BarChartComponent 
                      data={kpis.timeSpentDistribution} 
                      title={t.linkedin.charts.timeSpentDistribution} 
                    />
                  </div>
                )}
                {kpis.engagementTimeOverTime.length > 0 && (
                  <div className="animate-slide-in-right" style={{ animationDelay: "1400ms" }}>
                    <LineChartComponent 
                      data={kpis.engagementTimeOverTime} 
                      title={t.linkedin.charts.engagementTimeOverTime} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Other Important Metrics */}
            {(kpis.topContent.length > 0 || kpis.engagementByType.length > 0 || kpis.reachBySource.length > 0) && (
              <>
                {kpis.topContent.length > 0 && (
                  <div className="animate-scale-in" style={{ animationDelay: "1500ms" }}>
                    <BarChartComponent 
                      data={kpis.topContent} 
                      title={t.linkedin.charts.topContent} 
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {kpis.engagementByType.length > 0 && (
                    <div className="animate-slide-in-left" style={{ animationDelay: "1600ms" }}>
                      <PieChartComponent 
                        data={kpis.engagementByType} 
                        title={t.linkedin.charts.engagementByType} 
                      />
                    </div>
                  )}
                  {kpis.reachBySource.length > 0 && (
                    <div className="animate-slide-in-right" style={{ animationDelay: "1700ms" }}>
                      <BarChartComponent 
                        data={kpis.reachBySource} 
                        title={t.linkedin.charts.reachBySource} 
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Data Info Card */}
          <Card className="bg-gradient-to-br from-card to-card/95 border-2 hover:border-primary/30 transition-all duration-300 hover-lift animate-scale-in" style={{ animationDelay: "1100ms" }}>
            <CardHeader>
              <CardTitle className="text-xl">
                {isRTL ? "معلومات البيانات" : "Data Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">
                    {isRTL ? "آخر تحديث:" : "Last Updated:"}
                  </p>
                  <p className="font-medium">
                    {data.timestamp ? new Date(data.timestamp).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    {isRTL ? "مصادر البيانات:" : "Data Sources:"}
                  </p>
                  <p className="font-medium">
                    Content, Visitors, Followers, Competitors
                  </p>
                </div>
              </div>
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


