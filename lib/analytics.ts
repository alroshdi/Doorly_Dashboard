import { format, startOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO, isValid, subWeeks, subDays, eachDayOfInterval } from "date-fns";

export interface RequestData {
  [key: string]: any;
}

export interface KPIMetrics {
  totalRequests: number;
  newToday: number;
  thisWeek: number;
  verified: number; // From verify_status_ar === "موثق"
  active: number;
  pending: number;
  cancelled: number;
  paymentPending: number;
  paymentPendingVerify: number; // From verify_status_ar column
  totalOffers: number;
  totalViewsCount: number; // Total views from view_count column
  avgViews: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export function detectColumn(data: RequestData[], possibleNames: string[]): string | null {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  for (const name of possibleNames) {
    const found = keys.find(k => 
      k.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(k.toLowerCase())
    );
    if (found) return found;
  }
  return null;
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) return parsed;
    // Try other formats
    const date = new Date(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

// Helper function to normalize status_ar value for comparison
function normalizeStatusAr(status: string): string {
  return String(status || "").trim();
}

export function calculateKPIs(data: RequestData[]): KPIMetrics {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 6 }); // Saturday for Arabic week

  const dateColumn = detectColumn(data, ["created_at", "date", "created_at_date", "timestamp"]);
  const offersColumn = detectColumn(data, ["offers", "عدد_العروض", "offers_count"]);
  const viewsColumn = detectColumn(data, ["view_count", "views", "مشاهدات", "views_count"]);
  const priceMinColumn = detectColumn(data, ["price_min", "min_price", "أقل_سعر"]);
  const priceMaxColumn = detectColumn(data, ["price_max", "max_price", "أعلى_سعر"]);

  let totalRequests = data.length;
  let newToday = 0;
  let thisWeek = 0;
  let verified = 0; // From verify_status_ar === "موثق"
  let active = 0;
  let pending = 0;
  let cancelled = 0;
  let paymentPending = 0;
  let paymentPendingVerify = 0; // From verify_status_ar column
  let totalOffers = 0;
  let totalViewsCount = 0; // Total views from view_count column
  let totalViews = 0; // For average calculation
  let viewsCount = 0;
  let prices: number[] = [];

  // Status mappings from status_ar column
  const STATUS_ACTIVE = "نشط";
  const STATUS_PENDING = "قيد المراجعة";
  const STATUS_PENDING_ALT = "تحت المراجعة"; // Alternative pending status
  const STATUS_CANCELLED = "ملغي";
  const STATUS_PAYMENT = "قيد الدفع";
  const STATUS_VERIFIED = "موثق"; // From verify_status_ar column

  data.forEach((row) => {
    // Date calculations
    if (dateColumn && row[dateColumn]) {
      const date = parseDate(String(row[dateColumn]));
      if (date) {
        if (date >= todayStart) newToday++;
        if (date >= weekStart) thisWeek++;
      }
    }

    // Status calculations - use status_ar column only
    if (row.status_ar !== undefined && row.status_ar !== null) {
      const statusAr = normalizeStatusAr(row.status_ar);
      
      if (statusAr === STATUS_ACTIVE) {
        active++;
      } else if (statusAr === STATUS_PENDING || statusAr === STATUS_PENDING_ALT) {
        // Handle both "قيد المراجعة" and "تحت المراجعة" (under review)
        pending++;
      } else if (statusAr === STATUS_CANCELLED || statusAr.startsWith(STATUS_CANCELLED)) {
        // Handle both "ملغي" and "ملغي من الادارة" (cancelled by administration)
        cancelled++;
      } else if (statusAr === STATUS_PAYMENT) {
        paymentPending++;
      }
      // If status_ar doesn't match any expected value, count as 0 (do nothing)
    }

    // Verify status calculations - use verify_status_ar column
    if (row.verify_status_ar !== undefined && row.verify_status_ar !== null) {
      const verifyStatusAr = normalizeStatusAr(row.verify_status_ar);
      if (verifyStatusAr === STATUS_PAYMENT) {
        paymentPendingVerify++;
      }
      if (verifyStatusAr === STATUS_VERIFIED) {
        verified++;
      }
    }

    // Offers
    if (offersColumn && row[offersColumn]) {
      const offers = Number(row[offersColumn]);
      if (!isNaN(offers)) totalOffers += offers;
    }

    // Views - from view_count column
    if (viewsColumn && row[viewsColumn]) {
      const views = Number(row[viewsColumn]);
      if (!isNaN(views) && views > 0) {
        totalViewsCount += views; // Total sum of all views
        totalViews += views; // For average calculation
        viewsCount++;
      }
    }

    // Prices
    if (priceMinColumn && row[priceMinColumn]) {
      const price = Number(row[priceMinColumn]);
      if (!isNaN(price) && price > 0) prices.push(price);
    }
    if (priceMaxColumn && row[priceMaxColumn]) {
      const price = Number(row[priceMaxColumn]);
      if (!isNaN(price) && price > 0) prices.push(price);
    }
  });

  return {
    totalRequests,
    newToday,
    thisWeek,
    verified,
    active,
    pending,
    cancelled,
    paymentPending,
    paymentPendingVerify,
    totalOffers,
    totalViewsCount,
    avgViews: viewsCount > 0 ? totalViews / viewsCount : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
  };
}

export function getRequestsOverTime(
  data: RequestData[],
  period: "daily" | "weekly" | "monthly" = "daily"
): ChartData[] {
  const dateColumn = detectColumn(data, ["created_at", "date", "created_at_date"]);
  if (!dateColumn) return [];

  const grouped: { [key: string]: number } = {};

  data.forEach((row) => {
    if (!row[dateColumn]) return;
    const date = parseDate(String(row[dateColumn]));
    if (!date) return;

    let key: string;
    if (period === "daily") {
      key = format(date, "yyyy-MM-dd");
    } else if (period === "weekly") {
      key = format(startOfWeek(date, { weekStartsOn: 6 }), "yyyy-MM-dd");
    } else {
      key = format(startOfMonth(date), "yyyy-MM");
    }

    grouped[key] = (grouped[key] || 0) + 1;
  });

  // For monthly period, ensure all months of 2025 are included
  if (period === "monthly") {
    const allMonths2025: string[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthKey = `2025-${String(month).padStart(2, '0')}`;
      allMonths2025.push(monthKey);
      // Initialize with 0 if no data exists for this month
      if (!grouped[monthKey]) {
        grouped[monthKey] = 0;
      }
    }
    
    // Return only 2025 months, sorted chronologically (ascending)
    return allMonths2025
      .map((monthKey) => ({ name: monthKey, value: grouped[monthKey] || 0 }))
      .sort((a, b) => {
        // Sort by date string (already in chronological order)
        return a.name.localeCompare(b.name);
      });
  }

  // For weekly period, include last 6 weeks
  if (period === "weekly") {
    const now = new Date();
    const allWeeks: string[] = [];
    
    // Get last 6 weeks (including current week)
    for (let i = 5; i >= 0; i--) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 6 }); // Saturday for Arabic week
      const weekKey = format(weekStart, "yyyy-MM-dd");
      allWeeks.push(weekKey);
      // Initialize with 0 if no data exists for this week
      if (!grouped[weekKey]) {
        grouped[weekKey] = 0;
      }
    }
    
    // Return last 6 weeks, sorted chronologically (ascending)
    return allWeeks
      .map((weekKey) => ({ name: weekKey, value: grouped[weekKey] || 0 }))
      .sort((a, b) => {
        // Sort by date string (ascending chronological order)
        return a.name.localeCompare(b.name);
      });
  }

  // For daily period, show last 30 days from the latest date in data
  if (period === "daily") {
    // Find the latest date in the data
    let latestDate: Date | null = null;
    data.forEach((row) => {
      if (!row[dateColumn]) return;
      const date = parseDate(String(row[dateColumn]));
      if (date && (!latestDate || date > latestDate)) {
        latestDate = date;
      }
    });

    if (latestDate) {
      // Get last 30 days from the latest date
      const startDate = subDays(latestDate, 29); // 29 days back + today = 30 days
      const allDays = eachDayOfInterval({ start: startDate, end: latestDate });
      
      const allDaysKeys = allDays.map(day => format(day, "yyyy-MM-dd"));
      
      // Return last 30 days, sorted chronologically (ascending)
      return allDaysKeys
        .map((dayKey) => ({ name: dayKey, value: grouped[dayKey] || 0 }))
        .sort((a, b) => {
          // Sort by date string (ascending chronological order)
          return a.name.localeCompare(b.name);
        });
    }
  }

  // Fallback: sort chronologically
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      // Sort by date string (ascending chronological order)
      return a.name.localeCompare(b.name);
    });
}

export function getRequestsByWilaya(data: RequestData[]): ChartData[] {
  // Prioritize city_name_ar column
  const grouped: { [key: string]: number } = {};

  data.forEach((row) => {
    let cityName = "";
    // Prioritize city_name_ar column
    if (row.city_name_ar !== undefined && row.city_name_ar !== null) {
      cityName = String(row.city_name_ar || "").trim();
    } else {
      // Fallback to wilaya/area columns
      const wilayaColumn = Object.keys(row || {}).find(k => 
        k.toLowerCase().includes("wilaya") || 
        k.toLowerCase().includes("area") ||
        k.toLowerCase().includes("منطقة") ||
        k.toLowerCase().includes("region")
      );
      if (wilayaColumn) {
        cityName = String(row[wilayaColumn] || "").trim();
      }
    }
    
    if (cityName) {
      grouped[cityName] = (grouped[cityName] || 0) + 1;
    }
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export function getSourceDistribution(data: RequestData[]): ChartData[] {
  const sourceColumn = detectColumn(data, ["source", "channel", "مصدر", "قناة"]);
  if (!sourceColumn) return [];

  const grouped: { [key: string]: number } = {};

  data.forEach((row) => {
    const source = String(row[sourceColumn] || "").trim();
    if (source) {
      grouped[source] = (grouped[source] || 0) + 1;
    }
  });

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export function getPropertyTypeDistribution(data: RequestData[]): ChartData[] {
  const grouped: { [key: string]: number } = {};

  data.forEach((row) => {
    let propertyType = "";
    // Prioritize property_type_ar column
    if (row.property_type_ar !== undefined && row.property_type_ar !== null) {
      propertyType = String(row.property_type_ar || "").trim();
    } else {
      // Fallback to property_type/type columns
      const typeColumn = Object.keys(row || {}).find(k => 
        k.toLowerCase().includes("property_type") || 
        k.toLowerCase().includes("type") ||
        k.toLowerCase().includes("نوع_العقار") ||
        k.toLowerCase().includes("نوع")
      );
      if (typeColumn) {
        propertyType = String(row[typeColumn] || "").trim();
      }
    }
    
    if (propertyType) {
      grouped[propertyType] = (grouped[propertyType] || 0) + 1;
    }
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
}

export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  requestCount: number;
  propertyTypes: { [key: string]: number };
  cities: { [key: string]: number };
  lastRequestDate?: string;
}

// Get customer requests count (sorted descending)
export function getCustomerRequestsCount(data: RequestData[]): ChartData[] {
  const customerIdColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_id")
  );
  const customerNameColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_name") ||
    k.toLowerCase().includes("name")
  );
  
  if (!customerIdColumn || data.length === 0) return [];

  const grouped: { [key: string]: { name: string; count: number } } = {};

  data.forEach((row) => {
    const customerId = String(row[customerIdColumn] || "").trim();
    if (customerId) {
      // Use customer name if available, otherwise fallback to ID
      const customerName = customerNameColumn 
        ? String(row[customerNameColumn] || "").trim() 
        : customerId;
      
      // Use customer name as key, or ID if name is not available
      const displayName = customerName || customerId;
      
      if (!grouped[customerId]) {
        grouped[customerId] = { name: displayName, count: 0 };
      }
      grouped[customerId].count++;
    }
  });

  return Object.values(grouped)
    .map(({ name, count }) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);
}

// Get customers with repeated property types
export function getCustomersWithRepeatedPropertyTypes(data: RequestData[]): CustomerAnalytics[] {
  const customerIdColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_id")
  );
  const customerNameColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_name")
  );
  
  // Prioritize Arabic name column, then English name, then fallback to property_type
  const propertyTypeArColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("property_type_ar")
  );
  const propertyTypeEnColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("property_type_en") ||
    (k.toLowerCase().includes("property_type") && !k.toLowerCase().includes("_id") && !k.toLowerCase().includes("_ar"))
  );
  const propertyTypeColumn = propertyTypeArColumn || propertyTypeEnColumn || 
    Object.keys(data[0] || {}).find(k => 
      k.toLowerCase().includes("property_type") && !k.toLowerCase().includes("_id")
    );

  if (!customerIdColumn || !propertyTypeColumn || data.length === 0) return [];

  const customerMap: { [key: string]: CustomerAnalytics } = {};

  data.forEach((row) => {
    const customerId = String(row[customerIdColumn] || "").trim();
    const customerName = customerNameColumn ? String(row[customerNameColumn] || "").trim() : customerId;
    
    // Get property type name (prioritize Arabic, then English, then fallback)
    let propertyType = "";
    if (propertyTypeArColumn) {
      propertyType = String(row[propertyTypeArColumn] || "").trim();
    }
    if (!propertyType && propertyTypeEnColumn) {
      propertyType = String(row[propertyTypeEnColumn] || "").trim();
    }
    if (!propertyType && propertyTypeColumn) {
      propertyType = String(row[propertyTypeColumn] || "").trim();
    }
    
    // Skip if it looks like an ID (numeric or contains "id" pattern)
    // Only include if it's a meaningful name
    if (propertyType && /^\d+$/.test(propertyType)) {
      // If it's a pure number (ID), skip this row or try to find name mapping
      return;
    }

    if (customerId && propertyType && propertyType.length > 1 && !propertyType.toLowerCase().includes(":")) {
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          customerId,
          customerName,
          requestCount: 0,
          propertyTypes: {},
          cities: {},
        };
      }
      customerMap[customerId].requestCount++;
      customerMap[customerId].propertyTypes[propertyType] = 
        (customerMap[customerId].propertyTypes[propertyType] || 0) + 1;
    }
  });

  // Filter customers with repeated property types (more than 1 request of same type)
  return Object.values(customerMap)
    .filter(customer => {
      return Object.values(customer.propertyTypes).some(count => count > 1);
    })
    .sort((a, b) => b.requestCount - a.requestCount);
}

// Get top customers by request count
export function getTopCustomers(data: RequestData[], limit: number = 10): CustomerAnalytics[] {
  const customerIdColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_id")
  );
  const customerNameColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_name")
  );
  const cityColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("city_name_ar") ||
    k.toLowerCase().includes("wilaya") ||
    k.toLowerCase().includes("area")
  );
  const dateColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("created_at") ||
    k.toLowerCase().includes("date")
  );

  if (!customerIdColumn || data.length === 0) return [];

  const customerMap: { [key: string]: CustomerAnalytics } = {};

  data.forEach((row) => {
    const customerId = String(row[customerIdColumn] || "").trim();
    const customerName = customerNameColumn ? String(row[customerNameColumn] || "").trim() : customerId;
    const city = cityColumn ? String(row[cityColumn] || "").trim() : "";
    const date = dateColumn ? String(row[dateColumn] || "").trim() : "";

    if (customerId) {
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          customerId,
          customerName,
          requestCount: 0,
          propertyTypes: {},
          cities: {},
        };
      }
      customerMap[customerId].requestCount++;
      if (city) {
        customerMap[customerId].cities[city] = (customerMap[customerId].cities[city] || 0) + 1;
      }
      if (date && (!customerMap[customerId].lastRequestDate || date > customerMap[customerId].lastRequestDate!)) {
        customerMap[customerId].lastRequestDate = date;
      }
    }
  });

  return Object.values(customerMap)
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, limit);
}

// Get top customers by city
export function getTopCustomersByCity(data: RequestData[], city: string, limit: number = 10): CustomerAnalytics[] {
  const cityColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("city_name_ar") ||
    k.toLowerCase().includes("wilaya") ||
    k.toLowerCase().includes("area")
  );

  if (!cityColumn || data.length === 0) return [];

  // Filter by city first
  const filteredData = data.filter(row => {
    const rowCity = String(row[cityColumn] || "").trim();
    return rowCity.toLowerCase() === city.toLowerCase() || rowCity === city;
  });

  return getTopCustomers(filteredData, limit);
}

// Get customer distribution by city
export function getCustomerDistributionByCity(data: RequestData[]): ChartData[] {
  const customerIdColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_id")
  );
  const cityColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("city_name_ar") ||
    k.toLowerCase().includes("wilaya") ||
    k.toLowerCase().includes("area")
  );

  if (!customerIdColumn || !cityColumn || data.length === 0) return [];

  const cityCustomerMap: { [city: string]: Set<string> } = {};

  data.forEach((row) => {
    const customerId = String(row[customerIdColumn] || "").trim();
    const city = String(row[cityColumn] || "").trim();
    
    if (customerId && city) {
      if (!cityCustomerMap[city]) {
        cityCustomerMap[city] = new Set();
      }
      cityCustomerMap[city].add(customerId);
    }
  });

  return Object.entries(cityCustomerMap)
    .map(([name, customers]) => ({ name, value: customers.size }))
    .sort((a, b) => b.value - a.value);
}

// Get favorite property types by customers
export function getFavoritePropertyTypesByCustomers(data: RequestData[]): ChartData[] {
  // Prioritize Arabic name column, then English name, then fallback to property_type
  const propertyTypeArColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("property_type_ar")
  );
  const propertyTypeEnColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("property_type_en") ||
    (k.toLowerCase().includes("property_type") && !k.toLowerCase().includes("_id") && !k.toLowerCase().includes("_ar"))
  );
  const propertyTypeIdColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("property_type_id")
  );

  // Use name column if available, otherwise use the general property_type column
  const propertyTypeColumn = propertyTypeArColumn || propertyTypeEnColumn || 
    Object.keys(data[0] || {}).find(k => 
      k.toLowerCase().includes("property_type") && !k.toLowerCase().includes("_id")
    );

  if (!propertyTypeColumn || data.length === 0) return [];

  const propertyTypeCount: { [type: string]: number } = {};

  data.forEach((row) => {
    // Get property type name (prioritize Arabic, then English, then fallback)
    let propertyType = "";
    if (propertyTypeArColumn) {
      propertyType = String(row[propertyTypeArColumn] || "").trim();
    }
    if (!propertyType && propertyTypeEnColumn) {
      propertyType = String(row[propertyTypeEnColumn] || "").trim();
    }
    if (!propertyType && propertyTypeColumn) {
      propertyType = String(row[propertyTypeColumn] || "").trim();
    }
    
    // Skip if it looks like an ID (numeric or contains "id" pattern)
    // Only include if it's a meaningful name
    if (propertyType && !/^\d+$/.test(propertyType) && !propertyType.toLowerCase().includes(":") && propertyType.length > 1) {
      propertyTypeCount[propertyType] = (propertyTypeCount[propertyType] || 0) + 1;
    }
  });

  return Object.entries(propertyTypeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Get customer KPIs
export interface CustomerKPIs {
  totalCustomers: number;
  activeCustomers: number; // Customers with requests in last 30 days
  topCustomerRequests: number;
  avgRequestsPerCustomer: number;
  customersWithMultipleRequests: number;
}

export function getCustomerKPIs(data: RequestData[]): CustomerKPIs {
  const customerIdColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("customer_id")
  );
  const dateColumn = Object.keys(data[0] || {}).find(k => 
    k.toLowerCase().includes("created_at") ||
    k.toLowerCase().includes("date")
  );

  if (!customerIdColumn || data.length === 0) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      topCustomerRequests: 0,
      avgRequestsPerCustomer: 0,
      customersWithMultipleRequests: 0,
    };
  }

  const customerMap: { [id: string]: { count: number; lastDate?: Date } } = {};
  const thirtyDaysAgo = subDays(new Date(), 30);

  data.forEach((row) => {
    const customerId = String(row[customerIdColumn] || "").trim();
    if (customerId) {
      if (!customerMap[customerId]) {
        customerMap[customerId] = { count: 0 };
      }
      customerMap[customerId].count++;

      if (dateColumn && row[dateColumn]) {
        const date = parseDate(String(row[dateColumn]));
        if (date) {
          if (!customerMap[customerId].lastDate || date > customerMap[customerId].lastDate) {
            customerMap[customerId].lastDate = date;
          }
        }
      }
    }
  });

  const totalCustomers = Object.keys(customerMap).length;
  const activeCustomers = Object.values(customerMap).filter(c => 
    c.lastDate && c.lastDate >= thirtyDaysAgo
  ).length;
  const topCustomerRequests = Math.max(...Object.values(customerMap).map(c => c.count), 0);
  const avgRequestsPerCustomer = totalCustomers > 0 
    ? data.length / totalCustomers 
    : 0;
  const customersWithMultipleRequests = Object.values(customerMap).filter(c => c.count > 1).length;

  return {
    totalCustomers,
    activeCustomers,
    topCustomerRequests,
    avgRequestsPerCustomer,
    customersWithMultipleRequests,
  };
}

export function getUsageTypeDistribution(data: RequestData[]): ChartData[] {
  const grouped: { [key: string]: number } = {};

  data.forEach((row) => {
    let requestType = "";
    // Prioritize req_type_ar column
    if (row.req_type_ar !== undefined && row.req_type_ar !== null) {
      requestType = String(row.req_type_ar || "").trim();
    } else {
      // Fallback to usage/request_type columns
      const usageColumn = Object.keys(row || {}).find(k => 
        k.toLowerCase().includes("req_type") ||
        k.toLowerCase().includes("usage") || 
        k.toLowerCase().includes("usage_type") ||
        k.toLowerCase().includes("نوع_الاستخدام") ||
        k.toLowerCase().includes("request_type")
      );
      if (usageColumn) {
        requestType = String(row[usageColumn] || "").trim();
      }
    }
    
    if (requestType) {
      grouped[requestType] = (grouped[requestType] || 0) + 1;
    }
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
}

