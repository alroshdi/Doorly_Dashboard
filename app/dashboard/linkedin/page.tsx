"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { DashboardLoader } from "@/components/dashboard-states";
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
import { RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      const response = await fetch(`/api/linkedin${q}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
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

  const renderContent = () => {
    if (!mounted) {
      return (
        <DashboardLoader label={isRTL ? "جاري تحميل بيانات LinkedIn..." : "Loading LinkedIn data..."} />
      );
    }

    if (loading) {
      return (
        <DashboardLoader label={isRTL ? "جاري تحميل بيانات LinkedIn..." : "Loading LinkedIn data..."} />
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center py-8">
          <Card className="max-w-md w-full border-destructive/40">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                {isRTL ? "خطأ" : "Error"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
              <Button type="button" onClick={() => fetchData()}>
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{isRTL ? "لا توجد بيانات" : "No data available"}</p>
        </div>
      );
    }

    const kpis = calculateLinkedInKPIs(data);
    const insights = generateLinkedInInsights(kpis, lang);

    const timeSeriesChartCount = [
      kpis.impressionsOverTime.length > 0,
      kpis.engagementsOverTime.length > 0,
      kpis.followersOverTime.length > 0,
    ].filter(Boolean).length;
    const timeSeriesGridClass = cn(
      "grid gap-2 md:gap-3",
      timeSeriesChartCount >= 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      timeSeriesChartCount === 2 && "grid-cols-1 lg:grid-cols-2",
      timeSeriesChartCount <= 1 && "grid-cols-1"
    );

    const audienceFollowerCharts = [kpis.followersByCountry.length > 0, kpis.followersByIndustry.length > 0].filter(
      Boolean
    ).length;
    const audienceVisitorCharts = [kpis.visitorsByCountry.length > 0, kpis.visitorsByIndustry.length > 0].filter(
      Boolean
    ).length;
    const sourceChartsCount = [kpis.visitorsBySource.length > 0, kpis.followersBySource.length > 0].filter(
      Boolean
    ).length;
    const engagementMixCount = [kpis.engagementByType.length > 0, kpis.reachBySource.length > 0].filter(
      Boolean
    ).length;

    const twoColOrFull = (n: number) =>
      cn("grid gap-2 md:gap-3", n >= 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1");
    const exportDate =
      data.exportEpochMs != null
        ? new Date(data.exportEpochMs).toLocaleDateString(isRTL ? "ar" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null;

    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <PageHeader
          title={t.linkedin.title}
          description={
            <>
              <span>{t.linkedin.subtitle}</span>
              {exportDate ? (
                <span className="mt-2 block text-xs text-muted-foreground">
                  {isRTL ? "تقريبًا من تصدير: " : "Approx. export window: "}
                  {exportDate}
                </span>
              ) : null}
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
              onClick={() => fetchData(true)}
            >
              <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
              {loading ? t.linkedin.refreshing : t.linkedin.refresh}
            </Button>
          }
        />

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
          <div className="space-y-4 md:space-y-6">
            <SectionHeader title={t.linkedin.sectionContent} description={t.linkedin.sectionHintContent} />

            {/* Time-based Charts - Only show if data exists */}
            {kpis.impressionsOverTime.length > 0 ||
            kpis.engagementsOverTime.length > 0 ||
            kpis.followersOverTime.length > 0 ? (
              <div className={timeSeriesGridClass}>
                {kpis.impressionsOverTime.length > 0 && (
                  <LineChartComponent 
                    data={kpis.impressionsOverTime} 
                    title={t.linkedin.charts.impressionsOverTime}
                    subtitle={isRTL ? "من ورقة Metrics (إجمالي الظهور اليومي)" : "From Metrics sheet (daily total impressions)"}
                    valueLabel={t.linkedin.charts.axisImpressions}
                  />
                )}
                {kpis.engagementsOverTime.length > 0 && (
                  <LineChartComponent 
                    data={kpis.engagementsOverTime} 
                    title={t.linkedin.charts.engagementsOverTime}
                    subtitle={isRTL ? "تفاعلات يومية (تعليقات + تفاعلات + مشاركات + نقرات)" : "Daily engagements (reactions + comments + reposts + clicks)"}
                    valueLabel={t.linkedin.charts.axisEngagements}
                  />
                )}
                {kpis.followersOverTime.length > 0 && (
                  <LineChartComponent
                    data={kpis.followersOverTime}
                    title={t.linkedin.charts.followersOverTime}
                    subtitle={isRTL ? "متابعون جدد يوميًا" : "New followers gained per day"}
                    valueLabel={t.linkedin.charts.axisNewFollowers}
                  />
                )}
              </div>
            ) : null}

            <SectionHeader
              className="pt-2"
              title={t.linkedin.sectionAudience}
              description={t.linkedin.sectionHintAudience}
            />

            {/* Followers Distribution - Only show if data exists */}
            {(kpis.followersByCountry.length > 0 || kpis.followersByIndustry.length > 0) && (
              <div className={twoColOrFull(audienceFollowerCharts)}>
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
              <div className={twoColOrFull(audienceVisitorCharts)}>
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

            <SectionHeader
              className="pt-2"
              title={t.linkedin.sectionBenchmark}
              description={t.linkedin.sectionHintBenchmark}
            />

            {/* User Sources - Where users come from */}
            {(kpis.visitorsBySource.length > 0 || kpis.followersBySource.length > 0) && (
              <div className={twoColOrFull(sourceChartsCount)}>
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
            {kpis.timeSpentDistribution.length > 0 && (
              <div className={twoColOrFull(1)}>
                <BarChartComponent 
                  data={kpis.timeSpentDistribution} 
                  title={t.linkedin.charts.timeSpentDistribution}
                  subtitle={isRTL ? "توزيع الوقت المستغرق" : "Time spent distribution"}
                />
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
                <div className={twoColOrFull(engagementMixCount)}>
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
    );
  };

  return <DashboardShell>{renderContent()}</DashboardShell>;
}


