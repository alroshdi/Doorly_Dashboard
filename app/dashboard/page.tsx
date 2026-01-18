"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopFilters, FilterState } from "@/components/top-filters";
import { KPICards } from "@/components/kpi-cards";
import { LineChartComponent } from "@/components/charts/line-chart";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { PieChartComponent } from "@/components/charts/pie-chart";
import { DonutChartComponent } from "@/components/charts/donut-chart";
import { Tables } from "@/components/tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";
import {
  calculateKPIs,
  getRequestsOverTime,
  getRequestsByWilaya,
  getSourceDistribution,
  getPropertyTypeDistribution,
  getUsageTypeDistribution,
  type RequestData,
} from "@/lib/analytics";
import { FileText, Loader2 } from "lucide-react";
import { parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { exportDashboardToPDF } from "@/lib/pdf-export";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    quickFilter: "",
    wilaya: "",
    requestType: "",
    propertyType: "",
    source: "",
    status: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/requests");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      setData(result);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (!data || data.length === 0) return [];

    // Date filter - improved date detection and filtering
    if (filters.startDate || filters.endDate) {
      // Try to find date column - prioritize created_at columns
      const dateColumn = Object.keys(data[0] || {}).find(k => {
        const key = k.toLowerCase();
        return key.includes("created_at") || 
               key.includes("created_at_date") ||
               key.includes("created_at_time") ||
               (key.includes("date") && !key.includes("updated"));
      }) || Object.keys(data[0] || {}).find(k =>
        k.toLowerCase().includes("date") ||
        k.toLowerCase().includes("timestamp")
      );

      if (dateColumn) {
        filtered = filtered.filter((row) => {
          const dateStr = String(row[dateColumn] || "").trim();
          if (!dateStr) return false;
          
          // Try to parse the date
          let date: Date;
          try {
            date = parseISO(dateStr);
            // If parseISO fails, try creating a new Date
            if (isNaN(date.getTime())) {
              date = new Date(dateStr);
            }
            // If still invalid, skip this row
            if (isNaN(date.getTime())) {
              return false;
            }
          } catch {
            return false;
          }

          // Normalize dates to start of day for accurate comparison
          const normalizeDate = (d: Date) => {
            const normalized = new Date(d);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
          };

          const rowDate = normalizeDate(date);

          if (filters.startDate && filters.endDate) {
            const start = normalizeDate(parseISO(filters.startDate));
            const end = normalizeDate(parseISO(filters.endDate));
            // Include both start and end dates
            return rowDate >= start && rowDate <= end;
          } else if (filters.startDate) {
            const start = normalizeDate(parseISO(filters.startDate));
            return rowDate >= start;
          } else if (filters.endDate) {
            const end = normalizeDate(parseISO(filters.endDate));
            return rowDate <= end;
          }
          return true;
        });
      }
    }

    // Other filters - use city_name_ar column
    if (filters.wilaya) {
      filtered = filtered.filter((row) => {
        // Prioritize city_name_ar column
        let rowValue = "";
        if (row.city_name_ar !== undefined && row.city_name_ar !== null) {
          rowValue = String(row.city_name_ar || "").trim();
        } else {
          // Fallback to wilaya/area column
          const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("wilaya") || k.toLowerCase().includes("area"));
          if (col) {
            rowValue = String(row[col] || "").trim();
          }
        }
        // Case-insensitive matching for better compatibility
        return rowValue.toLowerCase() === filters.wilaya.toLowerCase() || 
               rowValue === filters.wilaya;
      });
    }

    // Request type filter - use req_type_ar column
    if (filters.requestType) {
      filtered = filtered.filter((row) => {
        // Prioritize req_type_ar column
        let rowValue = "";
        if (row.req_type_ar !== undefined && row.req_type_ar !== null) {
          rowValue = String(row.req_type_ar || "").trim();
        } else {
          // Fallback to usage/request_type columns
          const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("usage") || k.toLowerCase().includes("request_type"));
          if (col) {
            rowValue = String(row[col] || "").trim();
          }
        }
        // Case-insensitive matching for better compatibility
        return rowValue.toLowerCase() === filters.requestType.toLowerCase() || 
               rowValue === filters.requestType;
      });
    }

    // Property type filter - use property_type_ar column
    if (filters.propertyType) {
      filtered = filtered.filter((row) => {
        // Prioritize property_type_ar column
        let rowValue = "";
        if (row.property_type_ar !== undefined && row.property_type_ar !== null) {
          rowValue = String(row.property_type_ar || "").trim();
        } else {
          // Fallback to property_type/type columns
          const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("property_type") || k.toLowerCase().includes("type"));
          if (col) {
            rowValue = String(row[col] || "").trim();
          }
        }
        // Case-insensitive matching for better compatibility
        return rowValue.toLowerCase() === filters.propertyType.toLowerCase() || 
               rowValue === filters.propertyType;
      });
    }

    // Source filter - synchronized with data
    if (filters.source) {
      filtered = filtered.filter((row) => {
        const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("source") || k.toLowerCase().includes("channel"));
        if (col) {
          const rowValue = String(row[col] || "").trim();
          // Case-insensitive matching for better compatibility
          return rowValue.toLowerCase() === filters.source.toLowerCase() || 
                 rowValue === filters.source;
        }
        return false;
      });
    }

    // Status filter - use status_ar column only
    if (filters.status) {
      filtered = filtered.filter((row) => {
        if (row.status_ar === undefined || row.status_ar === null) return false;
        const statusAr = String(row.status_ar || "").trim();
        // Case-insensitive matching and handle variations
        const filterStatus = filters.status.trim();
        return statusAr.toLowerCase() === filterStatus.toLowerCase() || 
               statusAr === filterStatus ||
               (filterStatus === "ملغي" && statusAr.startsWith("ملغي")); // Handle "ملغي من الادارة"
      });
    }

    return filtered;
  }, [data, filters]);

  const metrics = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const requestsOverTime = useMemo(() => getRequestsOverTime(filteredData, timePeriod), [filteredData, timePeriod]);
  const requestsByWilaya = useMemo(() => getRequestsByWilaya(filteredData), [filteredData]);
  const sourceDistribution = useMemo(() => getSourceDistribution(filteredData), [filteredData]);
  const propertyTypeDistribution = useMemo(() => getPropertyTypeDistribution(filteredData), [filteredData]);
  const usageTypeDistribution = useMemo(() => getUsageTypeDistribution(filteredData), [filteredData]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  if (loading) {
    // Use consistent text during SSR to prevent hydration mismatch
    const loadingText = mounted ? (isRTL ? "جاري التحميل..." : "Loading...") : "جاري التحميل...";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <div className="absolute inset-0 h-12 w-12 mx-auto animate-ping opacity-20">
              <Loader2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-lg animate-pulse-slow">{loadingText}</p>
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExportPDF = async () => {
    const reportTitle = isRTL 
      ? `تقرير دورلي - ${new Date().toLocaleDateString("ar-DZ")}`
      : `Doorly Report - ${new Date().toLocaleDateString("en-US")}`;
    
    await exportDashboardToPDF("dashboard-content", {
      title: reportTitle,
      filename: `doorly-dashboard-${new Date().toISOString().split("T")[0]}.pdf`,
      includeKPIs: true,
      includeCharts: true,
      includeTables: true,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div id="dashboard-content" className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Header Section - Compact layout */}
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {t.sidebar.overview}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? "لوحة تحكم شاملة لإدارة وتحليل طلبات العقارات" : "Comprehensive dashboard for real estate request management and analytics"}
            </p>
          </div>

          {/* Top Filters */}
          <div>
            <TopFilters filters={filters} onFiltersChange={setFilters} data={data} />
          </div>

          {/* KPI Cards */}
          <div data-kpi-section>
            <KPICards metrics={metrics} />
          </div>

          {/* Charts Section - Compact grid with insights */}
          <div className="space-y-2 md:space-y-3" data-chart-section>
            {/* Time Period Toggle for Line Chart */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <h2 className="text-lg font-semibold">{t.charts.requestsOverTime}</h2>
              <div className="flex gap-1 bg-muted p-0.5 rounded-md border border-border">
                <Button
                  variant={timePeriod === "daily" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("daily")}
                  className="h-7 text-xs"
                >
                  {t.charts.daily}
                </Button>
                <Button
                  variant={timePeriod === "weekly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("weekly")}
                  className="h-7 text-xs"
                >
                  {t.charts.weekly}
                </Button>
                <Button
                  variant={timePeriod === "monthly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("monthly")}
                  className="h-7 text-xs"
                >
                  {t.charts.monthly}
                </Button>
              </div>
            </div>

            <LineChartComponent 
              data={requestsOverTime} 
              title={t.charts.requestsOverTime}
              subtitle={isRTL ? "تطور عدد الطلبات عبر الزمن" : "Request trends over time"}
              insight={(() => {
                if (requestsOverTime.length === 0) return null;
                const values = requestsOverTime.filter(d => d.value > 0).map(d => d.value);
                if (values.length === 0) return null;
                const maxValue = Math.max(...values);
                const maxDate = requestsOverTime.find(d => d.value === maxValue)?.name || "";
                return isRTL 
                  ? `الذروة: ${new Intl.NumberFormat('ar-DZ').format(maxValue)} طلب في ${maxDate}`
                  : `Peak: ${new Intl.NumberFormat('en-US').format(maxValue)} requests on ${maxDate}`;
              })()}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
              <DonutChartComponent 
                data={requestsByWilaya} 
                title={t.charts.byWilaya}
                subtitle={isRTL ? "توزيع الطلبات حسب الولاية" : "Request distribution by region"}
              />
              <PieChartComponent 
                data={sourceDistribution} 
                title={t.charts.sourceDistribution}
                subtitle={isRTL ? "مصادر الطلبات" : "Request sources"}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
              <BarChartComponent 
                data={propertyTypeDistribution} 
                title={t.charts.propertyTypeDistribution}
                subtitle={isRTL ? "أنواع العقارات المطلوبة" : "Requested property types"}
              />
              <BarChartComponent 
                data={usageTypeDistribution} 
                title={t.charts.usageTypeDistribution}
                subtitle={isRTL ? "أنواع الاستخدام" : "Usage types"}
              />
            </div>
          </div>

          {/* Tables Section */}
          <div data-table-section>
            <Tables data={filteredData} />
          </div>

          {/* PDF Reports Button (UI Only) */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.reports.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportPDF}
              >
                <FileText className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
                {t.reports.export}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {isRTL ? "انقر لتصدير التقرير كملف PDF" : "Click to export report as PDF"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

