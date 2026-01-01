"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { Sidebar } from "@/components/sidebar";
import { TopFilters, FilterState } from "@/components/top-filters";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { PieChartComponent } from "@/components/charts/pie-chart";
import { DonutChartComponent } from "@/components/charts/donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";
import {
  getCustomerRequestsCount,
  getCustomersWithRepeatedPropertyTypes,
  getTopCustomers,
  getTopCustomersByCity,
  getCustomerDistributionByCity,
  getFavoritePropertyTypesByCustomers,
  getCustomerKPIs,
  type RequestData,
} from "@/lib/analytics";
import { Loader2, Search, MapPin, Building2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomerKPICards } from "@/components/customer-kpi-cards";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function CustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [selectedCity, setSelectedCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

    // Date filter
    if (filters.startDate || filters.endDate) {
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
          
          let date: Date;
          try {
            date = parseISO(dateStr);
            if (isNaN(date.getTime())) {
              date = new Date(dateStr);
            }
            if (isNaN(date.getTime())) {
              return false;
            }
          } catch {
            return false;
          }

          const normalizeDate = (d: Date) => {
            const normalized = new Date(d);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
          };

          const rowDate = normalizeDate(date);

          if (filters.startDate && filters.endDate) {
            const start = normalizeDate(parseISO(filters.startDate));
            const end = normalizeDate(parseISO(filters.endDate));
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

    // Other filters
    if (filters.wilaya) {
      filtered = filtered.filter((row) => {
        let rowValue = "";
        if (row.city_name_ar !== undefined && row.city_name_ar !== null) {
          rowValue = String(row.city_name_ar || "").trim();
        } else {
          const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("wilaya") || k.toLowerCase().includes("area"));
          if (col) {
            rowValue = String(row[col] || "").trim();
          }
        }
        return rowValue.toLowerCase() === filters.wilaya.toLowerCase() || 
               rowValue === filters.wilaya;
      });
    }

    if (filters.requestType) {
      filtered = filtered.filter((row) => {
        let rowValue = "";
        if (row.req_type_ar !== undefined && row.req_type_ar !== null) {
          rowValue = String(row.req_type_ar || "").trim();
        } else {
          const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("req_type") || k.toLowerCase().includes("usage") || k.toLowerCase().includes("request_type"));
          if (col) {
            rowValue = String(row[col] || "").trim();
          }
        }
        return rowValue.toLowerCase() === filters.requestType.toLowerCase() || 
               rowValue === filters.requestType;
      });
    }

    if (filters.propertyType) {
      filtered = filtered.filter((row) => {
        let rowValue = "";
        if (row.property_type_ar !== undefined && row.property_type_ar !== null) {
          rowValue = String(row.property_type_ar || "").trim();
        } else {
          const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("property_type") || k.toLowerCase().includes("type"));
          if (col) {
            rowValue = String(row[col] || "").trim();
          }
        }
        return rowValue.toLowerCase() === filters.propertyType.toLowerCase() || 
               rowValue === filters.propertyType;
      });
    }

    if (filters.source) {
      filtered = filtered.filter((row) => {
        const col = Object.keys(data[0] || {}).find(k => k.toLowerCase().includes("source") || k.toLowerCase().includes("channel"));
        if (col) {
          const rowValue = String(row[col] || "").trim();
          return rowValue.toLowerCase() === filters.source.toLowerCase() || 
                 rowValue === filters.source;
        }
        return false;
      });
    }

    if (filters.status) {
      filtered = filtered.filter((row) => {
        if (row.status_ar === undefined || row.status_ar === null) return false;
        const statusAr = String(row.status_ar || "").trim();
        const filterStatus = filters.status.trim();
        return statusAr.toLowerCase() === filterStatus.toLowerCase() || 
               statusAr === filterStatus ||
               (filterStatus === "ملغي" && statusAr.startsWith("ملغي"));
      });
    }

    return filtered;
  }, [data, filters]);

  // Customer analytics
  const customerKPIs = useMemo(() => getCustomerKPIs(filteredData), [filteredData]);
  const customerRequestsCount = useMemo(() => getCustomerRequestsCount(filteredData), [filteredData]);
  const customersWithRepeats = useMemo(() => getCustomersWithRepeatedPropertyTypes(filteredData), [filteredData]);
  const topCustomers = useMemo(() => getTopCustomers(filteredData, 20), [filteredData]);
  const topCustomersByCity = useMemo(() => {
    if (selectedCity) {
      return getTopCustomersByCity(filteredData, selectedCity, 20);
    }
    return [];
  }, [filteredData, selectedCity]);
  const customerDistributionByCity = useMemo(() => getCustomerDistributionByCity(filteredData), [filteredData]);
  const favoritePropertyTypes = useMemo(() => getFavoritePropertyTypesByCustomers(filteredData), [filteredData]);

  // Get unique cities for filter
  const cities = useMemo(() => {
    return Array.from(new Set((filteredData || []).map((row) => {
      if (row.city_name_ar !== undefined && row.city_name_ar !== null) {
        return String(row.city_name_ar || "").trim();
      }
      const col = Object.keys(row || {}).find(k => k.toLowerCase().includes("wilaya") || k.toLowerCase().includes("area"));
      return col ? String(row[col] || "").trim() : "";
    }).filter(Boolean))).sort();
  }, [filteredData]);

  // Filter top customers by search
  const filteredTopCustomers = useMemo(() => {
    if (!searchTerm) return topCustomers;
    const term = searchTerm.toLowerCase();
    return topCustomers.filter(customer => 
      customer.customerName.toLowerCase().includes(term) ||
      customer.customerId.toLowerCase().includes(term)
    );
  }, [topCustomers, searchTerm]);

  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const date = parseISO(dateStr);
      return format(date, isRTL ? "dd/MM/yyyy" : "MM/dd/yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 pt-16 lg:pt-6">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              {t.sidebar.brokers}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isRTL ? "تحليل شامل للعملاء وطلباتهم مع إحصائيات مفصلة ورسوم بيانية واضحة" : "Comprehensive customer analytics with detailed statistics and clear charts"}
            </p>
          </div>

          <TopFilters filters={filters} onFiltersChange={setFilters} data={filteredData} />

          {/* Customer KPI Cards */}
          <CustomerKPICards metrics={customerKPIs} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Customer Requests Count Chart */}
            <BarChartComponent 
              data={customerRequestsCount.slice(0, 10)} 
              title={isRTL ? "عدد طلبات العملاء (أعلى 10)" : "Customer Requests Count (Top 10)"} 
            />

            {/* Customer Distribution by City */}
            <DonutChartComponent 
              data={customerDistributionByCity.slice(0, 10)} 
              title={isRTL ? "توزيع العملاء حسب المناطق" : "Customer Distribution by City"} 
            />
          </div>

          {/* Favorite Property Types */}
          <BarChartComponent 
            data={favoritePropertyTypes.slice(0, 10)} 
            title={isRTL ? "أنواع العقارات المفضلة للعملاء" : "Favorite Property Types by Customers"} 
          />

          {/* Top Customers Table */}
          <Card className="bg-gradient-to-br from-card to-card/95 border-2 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle className="text-lg sm:text-xl">{isRTL ? "العملاء الأكثر طلباً" : "Top Customers"}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-2" : "left-2")} />
                  <Input
                    placeholder={isRTL ? "بحث عن عميل..." : "Search customer..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn("transition-all duration-200 min-h-[44px]", isRTL ? "pr-8" : "pl-8")}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "#" : "#"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "معرف العميل" : "Customer ID"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "اسم العميل" : "Customer Name"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "عدد الطلبات" : "Request Count"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "المناطق" : "Cities"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "آخر طلب" : "Last Request"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTopCustomers.length > 0 ? (
                        filteredTopCustomers.map((customer, idx) => (
                          <tr key={idx} className="border-b hover:bg-primary/5 transition-colors duration-200">
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                              {idx + 1}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm font-medium", isRTL ? "text-right" : "text-left")}>
                              {customer.customerId}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm", isRTL ? "text-right" : "text-left")}>
                              {customer.customerName || "-"}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm font-bold text-primary", isRTL ? "text-right" : "text-left")}>
                              {customer.requestCount}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm", isRTL ? "text-right" : "text-left")}>
                              <div className="flex items-center gap-1 flex-wrap">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {Object.keys(customer.cities).slice(0, 2).join(", ")}
                                  {Object.keys(customer.cities).length > 2 && ` +${Object.keys(customer.cities).length - 2}`}
                                </span>
                              </div>
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(customer.lastRequestDate)}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={cn("p-8 text-center text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                            {isRTL ? "لا توجد بيانات" : "No data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customers with Repeated Property Types */}
          <Card className="bg-gradient-to-br from-card to-card/95 border-2 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{isRTL ? "عملاء مع تكرار في نوع العقار" : "Customers with Repeated Property Types"}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isRTL ? "العملاء الذين لديهم أكثر من طلب واحد لنفس نوع العقار" : "Customers with multiple requests for the same property type"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "#" : "#"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "اسم العميل" : "Customer Name"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "عدد الطلبات" : "Request Count"}
                        </th>
                        <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {isRTL ? "أنواع العقارات المكررة" : "Repeated Property Types"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersWithRepeats.length > 0 ? (
                        customersWithRepeats.slice(0, 20).map((customer, idx) => (
                          <tr key={idx} className="border-b hover:bg-primary/5 transition-colors duration-200">
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                              {idx + 1}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm font-medium", isRTL ? "text-right" : "text-left")}>
                              {customer.customerName || customer.customerId}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm font-bold text-primary", isRTL ? "text-right" : "text-left")}>
                              {customer.requestCount}
                            </td>
                            <td className={cn("p-2 sm:p-3 text-xs sm:text-sm", isRTL ? "text-right" : "text-left")}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {Object.entries(customer.propertyTypes)
                                    .filter(([_, count]) => count > 1)
                                    .map(([type, count]) => (
                                      <span key={type} className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md mr-1 mb-1 text-xs">
                                        {type} ({count})
                                      </span>
                                    ))}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={cn("p-8 text-center text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                            {isRTL ? "لا توجد بيانات" : "No data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers by City */}
          <Card className="bg-gradient-to-br from-card to-card/95 border-2 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">{isRTL ? "العملاء الأكثر طلباً حسب المنطقة" : "Top Customers by City"}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {isRTL ? "اختر منطقة لعرض العملاء الأكثر نشاطاً فيها" : "Select a city to view the most active customers"}
                  </p>
                </div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-2 border-2 rounded-lg bg-background hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] w-full sm:w-auto text-sm sm:text-base"
                >
                  <option value="">{isRTL ? "اختر المنطقة" : "Select City"}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCity ? (
                topCustomersByCity.length > 0 ? (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="border-b-2 border-border">
                            <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                              {isRTL ? "#" : "#"}
                            </th>
                            <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                              {isRTL ? "اسم العميل" : "Customer Name"}
                            </th>
                            <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                              {isRTL ? "عدد الطلبات" : "Request Count"}
                            </th>
                            <th className={cn("p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                              {isRTL ? "آخر طلب" : "Last Request"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCustomersByCity.map((customer, idx) => (
                            <tr key={idx} className="border-b hover:bg-primary/5 transition-colors duration-200">
                              <td className={cn("p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                                {idx + 1}
                              </td>
                              <td className={cn("p-2 sm:p-3 text-xs sm:text-sm font-medium", isRTL ? "text-right" : "text-left")}>
                                {customer.customerName || customer.customerId}
                              </td>
                              <td className={cn("p-2 sm:p-3 text-xs sm:text-sm font-bold text-primary", isRTL ? "text-right" : "text-left")}>
                                {customer.requestCount}
                              </td>
                              <td className={cn("p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground", isRTL ? "text-right" : "text-left")}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(customer.lastRequestDate)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                    {isRTL ? "لا يوجد عملاء في هذه المنطقة" : "No customers in this city"}
                  </div>
                )
              ) : (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <MapPin className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">{isRTL ? "اختر منطقة لعرض العملاء" : "Select a city to view customers"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


