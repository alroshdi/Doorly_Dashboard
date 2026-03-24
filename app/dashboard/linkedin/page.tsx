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
import {
  calculateLinkedInKPIs,
  generateLinkedInInsights,
  type LinkedInData,
} from "@/lib/linkedin-analytics";
import { Loader2, RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const fetchData = async (refresh = false) => {
    try {
      setLoading(true);
      const q = refresh ? "?refresh=1" : "";
      const response = await fetch(`/api/linkedin${q}`);
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to fetch LinkedIn data");
      }
      setData(result as LinkedInData);
      setError("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load LinkedIn data";
      setError(message);
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
                type="button"
                onClick={() => fetchData()}
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
    const insights = generateLinkedInInsights(kpis, lang);
    const exportDate =
      data.exportEpochMs != null
        ? new Date(data.exportEpochMs).toLocaleDateString(isRTL ? "ar" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null;

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Header Section */}
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {t.linkedin.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t.linkedin.subtitle}
                {exportDate ? (
                  <span className="block mt-1 text-xs">
                    {isRTL ? "تقريبًا من تصدير: " : "Approx. export window: "}
                    {exportDate}
                  </span>
                ) : null}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              disabled={loading}
              onClick={() => fetchData(true)}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? t.linkedin.refreshing : t.linkedin.refresh}
            </Button>
          </div>

          {insights.bullets.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0" />
                  {insights.headline}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className={`list-disc space-y-1.5 text-sm text-muted-foreground ${isRTL ? "pr-5" : "pl-5"}`}>
                  {insights.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* KPI Cards */}
          <div>
            <LinkedInKPICards kpis={kpis} />
          </div>

          {/* Charts Section */}
          <div className="space-y-4 md:space-y-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t.linkedin.sectionContent}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.linkedin.sectionHintContent}</p>
            </div>

            {/* Time-based Charts - Only show if data exists */}
            {kpis.impressionsOverTime.length > 0 ||
            kpis.engagementsOverTime.length > 0 ||
            kpis.followersOverTime.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                {kpis.impressionsOverTime.length > 0 && (
                  <LineChartComponent 
                    data={kpis.impressionsOverTime} 
                    title={t.linkedin.charts.impressionsOverTime}
                    subtitle={isRTL ? "من ورقة Metrics (إجمالي الظهور اليومي)" : "From Metrics sheet (daily total impressions)"}
                  />
                )}
                {kpis.engagementsOverTime.length > 0 && (
                  <LineChartComponent 
                    data={kpis.engagementsOverTime} 
                    title={t.linkedin.charts.engagementsOverTime}
                    subtitle={isRTL ? "تفاعلات يومية (تعليقات + تفاعلات + مشاركات + نقرات)" : "Daily engagements (reactions + comments + reposts + clicks)"}
                  />
                )}
                {kpis.followersOverTime.length > 0 && (
                  <LineChartComponent
                    data={kpis.followersOverTime}
                    title={t.linkedin.charts.followersOverTime}
                    subtitle={isRTL ? "متابعون جدد يوميًا" : "New followers gained per day"}
                  />
                )}
              </div>
            ) : null}

            <div className="pt-2">
              <h2 className="text-lg font-semibold tracking-tight">{t.linkedin.sectionAudience}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.linkedin.sectionHintAudience}</p>
            </div>

            {/* Followers Distribution - Only show if data exists */}
            {(kpis.followersByCountry.length > 0 || kpis.followersByIndustry.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                {kpis.followersByCountry.length > 0 && (
                  <DonutChartComponent 
                    data={kpis.followersByCountry} 
                    title={t.linkedin.charts.followersByCountry}
                    subtitle={isRTL ? "توزيع المتابعين حسب الموقع الجغرافي" : "Followers by geographic location"}
                  />
                )}
                {kpis.followersByIndustry.length > 0 && (
                  <PieChartComponent 
                    data={kpis.followersByIndustry} 
                    title={t.linkedin.charts.followersByIndustry}
                    subtitle={isRTL ? "توزيع المتابعين حسب الصناعة" : "Followers distribution by industry"}
                  />
                )}
              </div>
            )}

            {/* Visitors Distribution - Only show if data exists */}
            {(kpis.visitorsByCountry.length > 0 || kpis.visitorsByIndustry.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                {kpis.visitorsByCountry.length > 0 && (
                  <BarChartComponent 
                    data={kpis.visitorsByCountry} 
                    title={t.linkedin.charts.visitorsByCountry}
                    subtitle={isRTL ? "مشاهدات الصفحة حسب الموقع" : "Page views by location"}
                  />
                )}
                {kpis.visitorsByIndustry.length > 0 && (
                  <BarChartComponent 
                    data={kpis.visitorsByIndustry} 
                    title={t.linkedin.charts.visitorsByIndustry}
                    subtitle={isRTL ? "الزوار حسب الصناعة" : "Visitors by industry"}
                  />
                )}
              </div>
            )}

            <div className="pt-2">
              <h2 className="text-lg font-semibold tracking-tight">{t.linkedin.sectionBenchmark}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.linkedin.sectionHintBenchmark}</p>
            </div>

            {/* Competitor Comparison */}
            {kpis.competitorComparison.length > 0 && (
              <BarChartComponent 
                data={kpis.competitorComparison.map(c => ({ name: c.name, value: c.followers }))} 
                title={t.linkedin.charts.competitorComparison}
                subtitle={isRTL ? "متابعو الصفحة حسب التصدير" : "Page followers from competitor export"}
              />
            )}

            {/* User Sources - Where users come from */}
            {(kpis.visitorsBySource.length > 0 || kpis.followersBySource.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                {kpis.visitorsBySource.length > 0 && (
                  <PieChartComponent 
                    data={kpis.visitorsBySource} 
                    title={t.linkedin.charts.visitorsBySource}
                    subtitle={isRTL ? "مصادر الزوار" : "Visitor sources"}
                  />
                )}
                {kpis.followersBySource.length > 0 && (
                  <DonutChartComponent 
                    data={kpis.followersBySource} 
                    title={t.linkedin.charts.followersBySource}
                    subtitle={isRTL ? "مصادر المتابعين" : "Follower sources"}
                  />
                )}
              </div>
            )}

            {/* Time Spent Metrics */}
            {(kpis.timeSpentDistribution.length > 0 || kpis.engagementTimeOverTime.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                {kpis.timeSpentDistribution.length > 0 && (
                  <BarChartComponent 
                    data={kpis.timeSpentDistribution} 
                    title={t.linkedin.charts.timeSpentDistribution}
                    subtitle={isRTL ? "توزيع الوقت المستغرق" : "Time spent distribution"}
                  />
                )}
                {kpis.engagementTimeOverTime.length > 0 && (
                  <LineChartComponent 
                    data={kpis.engagementTimeOverTime} 
                    title={t.linkedin.charts.engagementTimeOverTime}
                    subtitle={isRTL ? "وقت التفاعل عبر الزمن" : "Engagement time over time"}
                  />
                )}
              </div>
            )}

            {/* Other Important Metrics */}
            {(kpis.topContent.length > 0 || kpis.engagementByType.length > 0 || kpis.reachBySource.length > 0) && (
              <>
                {kpis.topContent.length > 0 && (
                  <BarChartComponent 
                    data={kpis.topContent} 
                    title={t.linkedin.charts.topContent}
                    subtitle={isRTL ? "أفضل المحتوى أداءً" : "Top performing content"}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                  {kpis.engagementByType.length > 0 && (
                    <PieChartComponent 
                      data={kpis.engagementByType} 
                      title={t.linkedin.charts.engagementByType}
                      subtitle={isRTL ? "التفاعل حسب النوع" : "Engagement by type"}
                    />
                  )}
                  {kpis.reachBySource.length > 0 && (
                    <BarChartComponent 
                      data={kpis.reachBySource} 
                      title={t.linkedin.charts.reachBySource}
                      subtitle={isRTL ? "الوصول حسب المصدر" : "Reach by source"}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Data Info Card */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.linkedin.dataLineage}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1">
                    {isRTL ? "آخر تحميل للوحة:" : "Dashboard loaded at:"}
                  </p>
                  <p className="font-medium">
                    {data.timestamp ? new Date(data.timestamp).toLocaleString(isRTL ? "ar" : "en-US") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t.linkedin.exportBundle}</p>
                  <p className="font-medium">
                    {exportDate ?? (isRTL ? "غير محدد" : "Not specified")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">{t.linkedin.filesLabel}</p>
                <ul className={`space-y-1 font-mono text-xs break-all ${isRTL ? "pr-0" : ""}`}>
                  <li>
                    <span className="text-muted-foreground">content · </span>
                    {data.sources?.content ?? "—"}
                  </li>
                  <li>
                    <span className="text-muted-foreground">visitors · </span>
                    {data.sources?.visitors ?? "—"}
                  </li>
                  <li>
                    <span className="text-muted-foreground">followers · </span>
                    {data.sources?.followers ?? "—"}
                  </li>
                  <li>
                    <span className="text-muted-foreground">{t.linkedin.competitorFile} · </span>
                    {data.sources?.competitors ?? t.linkedin.none}
                  </li>
                </ul>
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


