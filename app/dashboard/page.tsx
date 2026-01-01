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
import { Loader2 } from "lucide-react";
import { parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

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
      setError("");
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch("/api/requests", {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check if response has error property
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(Array.isArray(result) ? result : []);
      setError("");
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Request timeout. Please check your connection and try again.");
      } else {
        setError(err.message || "Failed to load data. Please check the console for details.");
      }
      console.error("Error fetching data:", err);
      setData([]); // Set empty array on error
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

  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <div className="absolute inset-0 h-12 w-12 mx-auto animate-ping opacity-20">
              <Loader2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-lg animate-pulse-slow">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="max-w-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-destructive">{isRTL ? "خطأ" : "Error"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={fetchData} className="flex-1">
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setError("");
                  setLoading(false);
                  setData([]);
                }}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {isRTL 
                ? "تأكد من أن خادم API يعمل وأن بيانات Google Sheets متوفرة." 
                : "Make sure the API server is running and Google Sheets data is available."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div id="dashboard-content" className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in pt-16 lg:pt-6">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 md:mb-8 animate-slide-down">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-2 sm:mb-3 animate-fade-in bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {t.sidebar.overview}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg animate-slide-up max-w-2xl" style={{ animationDelay: "100ms" }}>
                  {isRTL ? "لوحة تحكم شاملة لإدارة وتحليل طلبات العقارات" : "Comprehensive dashboard for real estate request management and analytics"}
                </p>
              </div>
            </div>
          </div>

          {/* Top Filters */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <TopFilters filters={filters} onFiltersChange={setFilters} data={data} />
          </div>

          {/* KPI Cards */}
          <div className="animate-slide-up" style={{ animationDelay: "300ms" }} data-kpi-section>
            <KPICards metrics={metrics} />
          </div>

          {/* Charts Section */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-slide-up" style={{ animationDelay: "400ms" }} data-chart-section>
            {/* Time Period Toggle for Line Chart */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.charts.requestsOverTime}</h2>
              <div className="flex gap-1.5 sm:gap-2 bg-muted/50 p-1 rounded-lg backdrop-blur-sm border border-border/50 w-full sm:w-auto">
                <Button
                  variant={timePeriod === "daily" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("daily")}
                  className="transition-all duration-300 hover:scale-105 active:scale-95 flex-1 sm:flex-initial min-h-[44px] text-xs sm:text-sm"
                >
                  {t.charts.daily}
                </Button>
                <Button
                  variant={timePeriod === "weekly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("weekly")}
                  className="transition-all duration-300 hover:scale-105 active:scale-95 flex-1 sm:flex-initial min-h-[44px] text-xs sm:text-sm"
                >
                  {t.charts.weekly}
                </Button>
                <Button
                  variant={timePeriod === "monthly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod("monthly")}
                  className="transition-all duration-300 hover:scale-105 active:scale-95 flex-1 sm:flex-initial min-h-[44px] text-xs sm:text-sm"
                >
                  {t.charts.monthly}
                </Button>
              </div>
            </div>

            <div className="animate-scale-in" style={{ animationDelay: "500ms" }}>
              <LineChartComponent data={requestsOverTime} title={t.charts.requestsOverTime} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="animate-slide-in-left" style={{ animationDelay: "600ms" }}>
                <DonutChartComponent data={requestsByWilaya} title={t.charts.byWilaya} />
              </div>
              <div className="animate-slide-in-right" style={{ animationDelay: "700ms" }}>
                <PieChartComponent data={sourceDistribution} title={t.charts.sourceDistribution} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="animate-slide-in-left" style={{ animationDelay: "800ms" }}>
                <BarChartComponent data={propertyTypeDistribution} title={t.charts.propertyTypeDistribution} />
              </div>
              <div className="animate-slide-in-right" style={{ animationDelay: "900ms" }}>
                <BarChartComponent data={usageTypeDistribution} title={t.charts.usageTypeDistribution} />
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="animate-slide-up" style={{ animationDelay: "1000ms" }} data-table-section>
            <Tables data={filteredData} />
          </div>
        </div>
      </div>
    </div>
  );
}

