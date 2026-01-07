import { format, startOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO, isValid, subWeeks, subDays, eachDayOfInterval } from "date-fns";

export interface RequestData {
  [key: string]: any;
}

export interface KPIMetrics {
  totalRequests: number;
  newToday: number;
  thisWeek: number;
  verified: number; // From verify_status_en === "Verified"
  active: number;
  completed: number; // From status_en column (was pending)
  cancelled: number;
  paymentPending: number;
  paymentPendingVerify: number; // From verify_status_ar column
  totalOffers: number;
  hasOffersColumn: boolean; // Whether offers_count column exists in data
  totalViewsCount: number; // Total views from view_count column
  avgViews: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  // Price range metrics (from price_from and price_to columns)
  minPriceFrom: number;
  maxPriceFrom: number;
  avgPriceFrom: number;
  minPriceTo: number;
  maxPriceTo: number;
  avgPriceTo: number;
  avgPriceRange: number; // Average of (price_to - price_from)
  // Area metrics
  minArea: number;
  maxArea: number;
  avgArea: number;
  totalArea: number;
  hasAreaColumn: boolean; // Whether area column exists in data
}

export interface ChartData {
  name: string;
  value: number;
}

export function detectColumn(data: RequestData[], possibleNames: string[]): string | null {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  
  // Debug: Log available columns in development
  if (process.env.NODE_ENV === "development" && possibleNames[0] === "area") {
    console.log("Available columns for area detection:", keys);
  }
  
  // First, try exact matches (case-insensitive)
  for (const name of possibleNames) {
    const exactMatch = keys.find(k => k.toLowerCase() === name.toLowerCase());
    if (exactMatch) {
      if (process.env.NODE_ENV === "development" && possibleNames[0] === "area") {
        console.log(`Found area column: "${exactMatch}" (matched "${name}")`);
      }
      return exactMatch;
    }
  }
  
  // Then, try partial matches
  for (const name of possibleNames) {
    const found = keys.find(k => 
      k.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(k.toLowerCase())
    );
    if (found) {
      if (process.env.NODE_ENV === "development" && possibleNames[0] === "area") {
        console.log(`Found area column (partial match): "${found}" (matched "${name}")`);
      }
      return found;
    }
  }
  
  // Last resort: Check if any column contains numeric area-like data
  // This helps when column name doesn't match but contains area values
  if (possibleNames[0] === "area" && keys.length > 0) {
    for (const key of keys) {
      // Check if this column has numeric values that look like area (typically 50-10000 range)
      const sampleValues = data.slice(0, Math.min(10, data.length))
        .map(row => {
          const val = String(row[key] || "").trim();
          if (!val || val === "" || val === "null" || val === "undefined") return null;
          const cleaned = val.replace(/[m²m2sqm\s,]/gi, '').replace(/[^\d.]/g, '');
          const num = Number(cleaned);
          return (!isNaN(num) && num > 0 && num < 100000) ? num : null;
        })
        .filter(v => v !== null);
      
      // If we found several numeric values in reasonable area range, this might be the area column
      if (sampleValues.length >= 3) {
        if (process.env.NODE_ENV === "development") {
          console.log(`Found potential area column by data analysis: "${key}" (${sampleValues.length} valid values found)`);
        }
        return key;
      }
    }
  }
  
  if (process.env.NODE_ENV === "development" && possibleNames[0] === "area") {
    console.log("No area column found. Available columns:", keys);
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

// Helper function to normalize English status value for comparison
function normalizeStatusEn(status: string): string {
  return String(status || "").trim().toLowerCase();
}

export function calculateKPIs(data: RequestData[]): KPIMetrics {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 6 }); // Saturday for Arabic week

  const dateColumn = detectColumn(data, ["created_at", "date", "created_at_date", "timestamp"]);
  const offersColumn = detectColumn(data, ["offers_count", "offers", "عدد_العروض"]);
  const viewsColumn = detectColumn(data, ["view_count", "views", "مشاهدات", "views_count"]);
  const priceMinColumn = detectColumn(data, ["price_min", "min_price", "أقل_سعر"]);
  const priceMaxColumn = detectColumn(data, ["price_max", "max_price", "أعلى_سعر"]);
  const priceFromColumn = detectColumn(data, ["price_from", "price_from", "من_السعر"]);
  const priceToColumn = detectColumn(data, ["price_to", "price_to", "إلى_السعر"]);
  // Enhanced area column detection - check for multiple variations including Google Sheets format
  // Note: Google Sheets API converts headers to lowercase and replaces spaces with underscores
  const areaColumn = detectColumn(data, [
    "area",           // Direct match
    "aa",             // Column header "AA" from Google Sheets
    "aa_area",        // If "AA" has sub-header "area"
    "المساحة",        // Arabic: المساحة
    "area_m2", 
    "area_sqm", 
    "surface", 
    "surface_area",
    "مساحة",          // Without ال prefix
    "area_(m²)",      // With parentheses (converted from "area (m²)")
    "area_(sqm)",     // With parentheses (converted from "area (sqm)")
    "المساحة_(م²)",   // Arabic with parentheses
    "size",
    "المساحة_بالمتر_المربع", // With underscores (converted from spaces)
    "area_m",
    "area_sq",
    "sqm",
    "m2",
    "m²",
    "square_meters",
    "square_meters_area"
  ]);

  let totalRequests = data.length;
  let newToday = 0;
  let thisWeek = 0;
  let verified = 0; // From verify_status_en === "Verified"
  let active = 0;
  let completed = 0; // From status_en column (was pending)
  let cancelled = 0;
  let paymentPending = 0;
  let paymentPendingVerify = 0; // From verify_status_ar column
  let totalOffers = 0;
  let totalViewsCount = 0; // Total views from view_count column
  let totalViews = 0; // For average calculation
  let viewsCount = 0;
  let prices: number[] = [];
  let pricesFrom: number[] = [];
  let pricesTo: number[] = [];
  let priceRanges: number[] = [];
  let areas: number[] = [];

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
      } else if (statusAr === STATUS_CANCELLED || statusAr.startsWith(STATUS_CANCELLED)) {
        // Handle both "ملغي" and "ملغي من الادارة" (cancelled by administration)
        cancelled++;
      } else if (statusAr === STATUS_PAYMENT) {
        paymentPending++;
      }
      // Note: Pending status is now calculated from verify_status_en column (see below)
      // If status_ar doesn't match any expected value, count as 0 (do nothing)
    }

    // Verify status calculations - use verify_status_ar column for payment
    if (row.verify_status_ar !== undefined && row.verify_status_ar !== null) {
      const verifyStatusAr = normalizeStatusAr(row.verify_status_ar);
      if (verifyStatusAr === STATUS_PAYMENT) {
        paymentPendingVerify++;
      }
    }

    // Verified status from verify_status_en column - only exact "Verified" match
    if (row.verify_status_en !== undefined && row.verify_status_en !== null && row.verify_status_en !== "") {
      const verifyStatusEn = normalizeStatusEn(String(row.verify_status_en));
      // Only count exact "Verified" match (case-insensitive)
      if (verifyStatusEn === "verified") {
        verified++;
      }
    }

    // Completed status from status_en column
    if (row.status_en !== undefined && row.status_en !== null) {
      const statusEn = normalizeStatusEn(row.status_en);
      // Check for various English completed statuses
      if (
        statusEn === "completed" ||
        statusEn === "done" ||
        statusEn === "finished" ||
        statusEn === "closed" ||
        statusEn.includes("completed") ||
        statusEn.includes("done") ||
        statusEn.includes("finished")
      ) {
        completed++;
      }
    }

    // Offers - from offers_count column
    if (offersColumn) {
      const offersValue = row[offersColumn];
      // Handle null, undefined, empty string, and zero values
      if (offersValue !== null && offersValue !== undefined && offersValue !== "") {
        const offers = Number(offersValue);
        if (!isNaN(offers) && offers >= 0) {
          totalOffers += offers;
        }
      }
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

    // Prices (legacy columns)
    if (priceMinColumn && row[priceMinColumn]) {
      const price = Number(row[priceMinColumn]);
      if (!isNaN(price) && price > 0) prices.push(price);
    }
    if (priceMaxColumn && row[priceMaxColumn]) {
      const price = Number(row[priceMaxColumn]);
      if (!isNaN(price) && price > 0) prices.push(price);
    }

    // Price from/to columns
    if (priceFromColumn && row[priceFromColumn]) {
      const priceFrom = Number(row[priceFromColumn]);
      if (!isNaN(priceFrom) && priceFrom >= 0) {
        pricesFrom.push(priceFrom);
      }
    }
    if (priceToColumn && row[priceToColumn]) {
      const priceTo = Number(row[priceToColumn]);
      if (!isNaN(priceTo) && priceTo >= 0) {
        pricesTo.push(priceTo);
        // Calculate price range if both from and to exist
        if (priceFromColumn && row[priceFromColumn]) {
          const priceFrom = Number(row[priceFromColumn]);
          if (!isNaN(priceFrom) && priceFrom >= 0 && priceTo >= priceFrom) {
            priceRanges.push(priceTo - priceFrom);
          }
        }
      }
    }

    // Area - enhanced detection: ignore empty, null, or non-numeric values
    if (areaColumn && row[areaColumn] !== undefined && row[areaColumn] !== null) {
      const areaValue = String(row[areaColumn]).trim();
      // Skip empty strings, null, undefined, and common placeholder values
      if (areaValue && 
          areaValue !== "" && 
          areaValue !== "null" && 
          areaValue !== "undefined" && 
          areaValue !== "N/A" && 
          areaValue !== "n/a" &&
          areaValue !== "-" &&
          areaValue !== "—") {
        // Remove common units and clean the value
        let cleanedValue = areaValue
          .replace(/[m²m2sqm\s]/gi, '') // Remove units and spaces first
          .replace(/,/g, '') // Remove commas (thousand separators)
          .replace(/[^\d.]/g, ''); // Keep only digits and decimal point
        
        // If empty after cleaning, try to extract number from mixed content
        if (!cleanedValue && /[\d]/.test(areaValue)) {
          cleanedValue = areaValue.match(/[\d.]+/)?.[0] || '';
        }
        
        const area = Number(cleanedValue);
        // Only accept valid positive numbers (ignore 0, negative, and NaN)
        if (!isNaN(area) && area > 0 && isFinite(area)) {
          areas.push(area);
        }
      }
    } else if (!areaColumn && data.indexOf(row) === 0) {
      // Log on first row if column not found (only in development to avoid spam)
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
        const allKeys = Object.keys(row);
        console.log('Area column not found. Available columns:', allKeys);
        console.log('Looking for area in columns:', allKeys.filter(k => 
          k.toLowerCase().includes('area') || 
          k.toLowerCase().includes('مساحة') || 
          k.toLowerCase() === 'aa' ||
          k.toLowerCase().includes('surface') ||
          k.toLowerCase().includes('size')
        ));
      }
    }
  });

  return {
    totalRequests,
    newToday,
    thisWeek,
    verified,
    active,
    completed,
    cancelled,
    paymentPending,
    paymentPendingVerify,
    totalOffers,
    hasOffersColumn: offersColumn !== null, // Track if offers_count column exists
    totalViewsCount,
    avgViews: viewsCount > 0 ? totalViews / viewsCount : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    // Price range metrics
    minPriceFrom: pricesFrom.length > 0 ? Math.min(...pricesFrom) : 0,
    maxPriceFrom: pricesFrom.length > 0 ? Math.max(...pricesFrom) : 0,
    avgPriceFrom: pricesFrom.length > 0 ? pricesFrom.reduce((a, b) => a + b, 0) / pricesFrom.length : 0,
    minPriceTo: pricesTo.length > 0 ? Math.min(...pricesTo) : 0,
    maxPriceTo: pricesTo.length > 0 ? Math.max(...pricesTo) : 0,
    avgPriceTo: pricesTo.length > 0 ? pricesTo.reduce((a, b) => a + b, 0) / pricesTo.length : 0,
    avgPriceRange: priceRanges.length > 0 ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length : 0,
    // Area metrics - calculated from real data only
    // minArea: Highest area value (Math.max of all areas)
    minArea: areas.length > 0 ? Math.min(...areas) : 0,
    // maxArea: Highest area value (Math.max of all areas)
    maxArea: areas.length > 0 ? Math.max(...areas) : 0,
    // avgArea: Average area (sum / count)
    avgArea: areas.length > 0 ? areas.reduce((a, b) => a + b, 0) / areas.length : 0,
    totalArea: areas.reduce((a, b) => a + b, 0),
    // hasAreaColumn: true if column exists AND has valid data
    hasAreaColumn: areaColumn !== null && areas.length > 0,
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

// Price and Area Analysis Functions

// Get price distribution by source
export function getPriceDistributionBySource(data: RequestData[]): ChartData[] {
  const sourceColumn = detectColumn(data, ["source", "channel", "مصدر", "قناة"]);
  const priceFromColumn = detectColumn(data, ["price_from", "price_from", "من_السعر"]);
  const priceToColumn = detectColumn(data, ["price_to", "price_to", "إلى_السعر"]);

  if (!sourceColumn || (!priceFromColumn && !priceToColumn)) return [];

  const sourcePriceMap: { [source: string]: { total: number; count: number } } = {};

  data.forEach((row) => {
    const source = String(row[sourceColumn] || "").trim();
    if (!source) return;

    let price = 0;
    if (priceFromColumn && row[priceFromColumn]) {
      const priceFrom = Number(row[priceFromColumn]);
      if (!isNaN(priceFrom) && priceFrom > 0) {
        price = priceFrom;
      }
    }
    if (priceToColumn && row[priceToColumn] && price === 0) {
      const priceTo = Number(row[priceToColumn]);
      if (!isNaN(priceTo) && priceTo > 0) {
        price = priceTo;
      }
    }
    // Use average if both exist
    if (priceFromColumn && priceToColumn && row[priceFromColumn] && row[priceToColumn]) {
      const priceFrom = Number(row[priceFromColumn]);
      const priceTo = Number(row[priceToColumn]);
      if (!isNaN(priceFrom) && !isNaN(priceTo) && priceFrom > 0 && priceTo > 0) {
        price = (priceFrom + priceTo) / 2;
      }
    }

    if (price > 0) {
      if (!sourcePriceMap[source]) {
        sourcePriceMap[source] = { total: 0, count: 0 };
      }
      sourcePriceMap[source].total += price;
      sourcePriceMap[source].count++;
    }
  });

  return Object.entries(sourcePriceMap)
    .map(([name, data]) => ({
      name,
      value: data.count > 0 ? data.total / data.count : 0, // Average price
    }))
    .sort((a, b) => b.value - a.value);
}

// Get area distribution by source
export function getAreaDistributionBySource(data: RequestData[]): ChartData[] {
  const sourceColumn = detectColumn(data, ["source", "channel", "مصدر", "قناة"]);
  // Use same enhanced area column detection as in calculateKPIs
  // Note: Google Sheets API converts headers to lowercase and replaces spaces with underscores
  const areaColumn = detectColumn(data, [
    "area",           // Direct match
    "aa",             // Column header "AA" from Google Sheets
    "aa_area",        // If "AA" has sub-header "area"
    "المساحة",        // Arabic: المساحة
    "area_m2", 
    "area_sqm", 
    "surface", 
    "surface_area",
    "مساحة",          // Without ال prefix
    "area_(m²)",      // With parentheses (converted from "area (m²)")
    "area_(sqm)",     // With parentheses (converted from "area (sqm)")
    "المساحة_(م²)",   // Arabic with parentheses
    "size",
    "المساحة_بالمتر_المربع", // With underscores (converted from spaces)
    "area_m",
    "area_sq",
    "sqm",
    "m2",
    "m²",
    "square_meters",
    "square_meters_area"
  ]);

  if (!sourceColumn || !areaColumn) return [];

  const sourceAreaMap: { [source: string]: { total: number; count: number } } = {};

  data.forEach((row) => {
    const source = String(row[sourceColumn] || "").trim();
    if (!source) return;

    // Enhanced area parsing - handle various formats
    const areaValue = String(row[areaColumn] || "").trim();
    if (!areaValue || areaValue === "" || areaValue === "null" || areaValue === "undefined" || areaValue === "N/A" || areaValue === "n/a") return;
    
    // Handle both Arabic and English numbers, commas as thousand separators
    let cleanedValue = areaValue
      .replace(/[m²m2sqm\s]/gi, '') // Remove units and spaces first
      .replace(/,/g, '') // Remove commas (thousand separators)
      .replace(/[^\d.]/g, ''); // Keep only digits and decimal point
    
    // If empty after cleaning, try to extract number from mixed content
    if (!cleanedValue && /[\d]/.test(areaValue)) {
      cleanedValue = areaValue.match(/[\d.]+/)?.[0] || '';
    }
    
    const area = Number(cleanedValue);
    if (!isNaN(area) && area > 0) {
      if (!sourceAreaMap[source]) {
        sourceAreaMap[source] = { total: 0, count: 0 };
      }
      sourceAreaMap[source].total += area;
      sourceAreaMap[source].count++;
    }
  });

  return Object.entries(sourceAreaMap)
    .map(([name, data]) => ({
      name,
      value: data.count > 0 ? data.total / data.count : 0, // Average area
    }))
    .sort((a, b) => b.value - a.value);
}

// Get price range distribution (buckets)
export function getPriceRangeDistribution(data: RequestData[]): ChartData[] {
  const priceFromColumn = detectColumn(data, ["price_from", "price_from", "من_السعر"]);
  const priceToColumn = detectColumn(data, ["price_to", "price_to", "إلى_السعر"]);

  if (!priceFromColumn && !priceToColumn) return [];

  const buckets: { [range: string]: number } = {
    "0-10K": 0,
    "10K-50K": 0,
    "50K-100K": 0,
    "100K-200K": 0,
    "200K-500K": 0,
    "500K+": 0,
  };

  data.forEach((row) => {
    let price = 0;
    if (priceFromColumn && row[priceFromColumn]) {
      const priceFrom = Number(row[priceFromColumn]);
      if (!isNaN(priceFrom) && priceFrom > 0) {
        price = priceFrom;
      }
    }
    if (priceToColumn && row[priceToColumn] && price === 0) {
      const priceTo = Number(row[priceToColumn]);
      if (!isNaN(priceTo) && priceTo > 0) {
        price = priceTo;
      }
    }
    // Use average if both exist
    if (priceFromColumn && priceToColumn && row[priceFromColumn] && row[priceToColumn]) {
      const priceFrom = Number(row[priceFromColumn]);
      const priceTo = Number(row[priceToColumn]);
      if (!isNaN(priceFrom) && !isNaN(priceTo) && priceFrom > 0 && priceTo > 0) {
        price = (priceFrom + priceTo) / 2;
      }
    }

    if (price > 0) {
      if (price < 10000) buckets["0-10K"]++;
      else if (price < 50000) buckets["10K-50K"]++;
      else if (price < 100000) buckets["50K-100K"]++;
      else if (price < 200000) buckets["100K-200K"]++;
      else if (price < 500000) buckets["200K-500K"]++;
      else buckets["500K+"]++;
    }
  });

  return Object.entries(buckets)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);
}

// Get area distribution (buckets)
export function getAreaDistribution(data: RequestData[]): ChartData[] {
  // Use same enhanced area column detection as in calculateKPIs
  // Note: Google Sheets API converts headers to lowercase and replaces spaces with underscores
  const areaColumn = detectColumn(data, [
    "area",           // Direct match
    "aa",             // Column header "AA" from Google Sheets
    "aa_area",        // If "AA" has sub-header "area"
    "المساحة",        // Arabic: المساحة
    "area_m2", 
    "area_sqm", 
    "surface", 
    "surface_area",
    "مساحة",          // Without ال prefix
    "area_(m²)",      // With parentheses (converted from "area (m²)")
    "area_(sqm)",     // With parentheses (converted from "area (sqm)")
    "المساحة_(م²)",   // Arabic with parentheses
    "size",
    "المساحة_بالمتر_المربع", // With underscores (converted from spaces)
    "area_m",
    "area_sq",
    "sqm",
    "m2",
    "m²",
    "square_meters",
    "square_meters_area"
  ]);

  if (!areaColumn) return [];

  const buckets: { [range: string]: number } = {
    "0-100": 0,
    "100-300": 0,
    "300-600": 0,
    "600-900": 0,
    "900+": 0,
  };

  data.forEach((row) => {
    // Enhanced area parsing - handle various formats
    const areaValue = String(row[areaColumn] || "").trim();
    if (!areaValue || areaValue === "" || areaValue === "null" || areaValue === "undefined" || areaValue === "N/A" || areaValue === "n/a") return;
    
    // Handle both Arabic and English numbers, commas as thousand separators
    let cleanedValue = areaValue
      .replace(/[m²m2sqm\s]/gi, '') // Remove units and spaces first
      .replace(/,/g, '') // Remove commas (thousand separators)
      .replace(/[^\d.]/g, ''); // Keep only digits and decimal point
    
    // If empty after cleaning, try to extract number from mixed content
    if (!cleanedValue && /[\d]/.test(areaValue)) {
      cleanedValue = areaValue.match(/[\d.]+/)?.[0] || '';
    }
    
    const area = Number(cleanedValue);
    if (!isNaN(area) && area > 0) {
      if (area < 100) buckets["0-100"]++;
      else if (area < 300) buckets["100-300"]++;
      else if (area < 600) buckets["300-600"]++;
      else if (area < 900) buckets["600-900"]++;
      else buckets["900+"]++;
    }
  });

  return Object.entries(buckets)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);
}

// Status Trends Over Time
export function getStatusTrendsOverTime(data: RequestData[], period: "daily" | "weekly" | "monthly" = "daily"): { [status: string]: ChartData[] } {
  const dateColumn = detectColumn(data, ["created_at", "date", "created_at_date"]);
  if (!dateColumn) return {};

  const statusColumn = "status_ar";
  const trends: { [status: string]: { [date: string]: number } } = {};

  data.forEach((row) => {
    if (!row[dateColumn] || !row[statusColumn]) return;
    const date = parseDate(String(row[dateColumn]));
    if (!date) return;

    const status = String(row[statusColumn] || "").trim();
    if (!status) return;

    let key: string;
    if (period === "daily") {
      key = format(date, "yyyy-MM-dd");
    } else if (period === "weekly") {
      key = format(startOfWeek(date, { weekStartsOn: 6 }), "yyyy-MM-dd");
    } else {
      key = format(startOfMonth(date), "yyyy-MM");
    }

    if (!trends[status]) {
      trends[status] = {};
    }
    trends[status][key] = (trends[status][key] || 0) + 1;
  });

  const result: { [status: string]: ChartData[] } = {};
  Object.keys(trends).forEach((status) => {
    result[status] = Object.entries(trends[status])
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  return result;
}

// Conversion Rate by Source
export function getConversionRateBySource(data: RequestData[]): ChartData[] {
  const sourceColumn = detectColumn(data, ["source", "channel", "مصدر", "قناة"]);
  if (!sourceColumn) return [];

  const sourceStats: { [source: string]: { total: number; completed: number; verified: number } } = {};

  data.forEach((row) => {
    const source = String(row[sourceColumn] || "").trim();
    if (!source) return;

    if (!sourceStats[source]) {
      sourceStats[source] = { total: 0, completed: 0, verified: 0 };
    }

    sourceStats[source].total++;

    // Check completed status
    if (row.status_ar) {
      const status = String(row.status_ar).trim();
      if (status === "مكتمل" || status.includes("مكتمل")) {
        sourceStats[source].completed++;
      }
    }

    // Check verified status
    if (row.verify_status_en) {
      const verified = String(row.verify_status_en).trim().toLowerCase();
      if (verified === "verified") {
        sourceStats[source].verified++;
      }
    }
  });

  return Object.entries(sourceStats)
    .map(([name, stats]) => ({
      name,
      value: stats.total > 0 ? ((stats.completed + stats.verified) / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

// Top Performing Sources (by completed/verified ratio)
export function getTopPerformingSources(data: RequestData[]): ChartData[] {
  const sourceColumn = detectColumn(data, ["source", "channel", "مصدر", "قناة"]);
  if (!sourceColumn) return [];

  const sourceStats: { [source: string]: { total: number; successful: number } } = {};

  data.forEach((row) => {
    const source = String(row[sourceColumn] || "").trim();
    if (!source) return;

    if (!sourceStats[source]) {
      sourceStats[source] = { total: 0, successful: 0 };
    }

    sourceStats[source].total++;

    // Count successful (completed or verified)
    const isCompleted = row.status_ar && String(row.status_ar).trim().includes("مكتمل");
    const isVerified = row.verify_status_en && String(row.verify_status_en).trim().toLowerCase() === "verified";

    if (isCompleted || isVerified) {
      sourceStats[source].successful++;
    }
  });

  return Object.entries(sourceStats)
    .map(([name, stats]) => ({
      name,
      value: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// Average Price by Property Type
export function getAveragePriceByPropertyType(data: RequestData[]): ChartData[] {
  const propertyTypeColumn = detectColumn(data, ["property_type_ar", "property_type"]);
  const priceFromColumn = detectColumn(data, ["price_from", "price_min", "السعر_من"]);
  
  if (!propertyTypeColumn || !priceFromColumn) return [];

  const typeStats: { [type: string]: { total: number; sum: number } } = {};

  data.forEach((row) => {
    const type = String(row[propertyTypeColumn] || "").trim();
    const price = Number(row[priceFromColumn]);
    
    if (type && !isNaN(price) && price > 0) {
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, sum: 0 };
      }
      typeStats[type].total++;
      typeStats[type].sum += price;
    }
  });

  return Object.entries(typeStats)
    .map(([name, stats]) => ({
      name,
      value: stats.total > 0 ? stats.sum / stats.total : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

// Request Status Distribution
export function getStatusDistribution(data: RequestData[]): ChartData[] {
  const statusColumn = "status_ar";
  const grouped: { [status: string]: number } = {};

  data.forEach((row) => {
    if (row[statusColumn] !== undefined && row[statusColumn] !== null) {
      const status = String(row[statusColumn] || "").trim();
      if (status) {
        grouped[status] = (grouped[status] || 0) + 1;
      }
    }
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// ==================== INSTAGRAM ANALYTICS ====================

export interface InstagramData {
  [key: string]: any;
}

export interface InstagramKPIs {
  totalPosts: number;
  totalEngagement: number; // likes + comments + saves
  engagementRate: number; // percentage
  totalReach: number;
  avgEngagementPerPost: number;
  bestPostingTime: string; // hour of day
}

export interface ScatterData {
  name: string;
  reach: number;
  engagement: number;
}

// Calculate Instagram KPIs
export function calculateInstagramKPIs(data: InstagramData[]): InstagramKPIs {
  if (!data || data.length === 0) {
    return {
      totalPosts: 0,
      totalEngagement: 0,
      engagementRate: 0,
      totalReach: 0,
      avgEngagementPerPost: 0,
      bestPostingTime: "غير متوفر",
    };
  }

  // Detect columns
  const likesColumn = detectColumn(data, ["likes", "like_count", "likes_count", "إعجابات"]);
  const commentsColumn = detectColumn(data, ["comments", "comment_count", "comments_count", "تعليقات"]);
  const savesColumn = detectColumn(data, ["saves", "save_count", "saves_count", "حفظ"]);
  const reachColumn = detectColumn(data, ["reach", "reach_count", "impressions", "وصول"]);
  const timestampColumn = detectColumn(data, ["timestamp", "created_time", "date", "post_date", "تاريخ"]);
  const mediaTypeColumn = detectColumn(data, ["media_type", "type", "content_type", "نوع_المحتوى"]);

  let totalPosts = data.length;
  let totalEngagement = 0;
  let totalReach = 0;
  const hourEngagement: { [hour: string]: { count: number; engagement: number } } = {};

  data.forEach((row) => {
    const likes = Number(row[likesColumn || ""] || 0);
    const comments = Number(row[commentsColumn || ""] || 0);
    const saves = Number(row[savesColumn || ""] || 0);
    const reach = Number(row[reachColumn || ""] || 0);

    const engagement = likes + comments + saves;
    totalEngagement += engagement;
    totalReach += reach;

    // Extract hour from timestamp
    if (timestampColumn && row[timestampColumn]) {
      try {
        const date = parseDate(String(row[timestampColumn]));
        if (date) {
          const hour = date.getHours().toString().padStart(2, "0");
          if (!hourEngagement[hour]) {
            hourEngagement[hour] = { count: 0, engagement: 0 };
          }
          hourEngagement[hour].count++;
          hourEngagement[hour].engagement += engagement;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });

  const avgEngagementPerPost = totalPosts > 0 ? totalEngagement / totalPosts : 0;
  const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

  // Find best posting time (hour with highest average engagement)
  let bestHour = "غير متوفر";
  let maxAvgEngagement = 0;
  Object.entries(hourEngagement).forEach(([hour, stats]) => {
    const avgEngagement = stats.count > 0 ? stats.engagement / stats.count : 0;
    if (avgEngagement > maxAvgEngagement) {
      maxAvgEngagement = avgEngagement;
      bestHour = `${hour}:00`;
    }
  });

  return {
    totalPosts,
    totalEngagement,
    engagementRate,
    totalReach,
    avgEngagementPerPost,
    bestPostingTime: bestHour,
  };
}

// Engagement Over Time
export function getEngagementOverTime(data: InstagramData[], period: "daily" | "weekly" | "monthly" = "daily"): ChartData[] {
  const likesColumn = detectColumn(data, ["likes", "like_count", "likes_count"]);
  const commentsColumn = detectColumn(data, ["comments", "comment_count", "comments_count"]);
  const savesColumn = detectColumn(data, ["saves", "save_count", "saves_count"]);
  const timestampColumn = detectColumn(data, ["timestamp", "created_time", "date", "post_date"]);

  if (!timestampColumn) return [];

  const grouped: { [key: string]: number } = {};

  data.forEach((row) => {
    const date = parseDate(String(row[timestampColumn] || ""));
    if (!date) return;

    const likes = Number(row[likesColumn || ""] || 0);
    const comments = Number(row[commentsColumn || ""] || 0);
    const saves = Number(row[savesColumn || ""] || 0);
    const engagement = likes + comments + saves;

    let key: string;
    if (period === "daily") {
      key = format(date, "yyyy-MM-dd");
    } else if (period === "weekly") {
      key = format(startOfWeek(date, { weekStartsOn: 6 }), "yyyy-MM-dd");
    } else {
      key = format(startOfMonth(date), "yyyy-MM");
    }

    grouped[key] = (grouped[key] || 0) + engagement;
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Content Type Performance
export function getContentTypePerformance(data: InstagramData[]): ChartData[] {
  const mediaTypeColumn = detectColumn(data, ["media_type", "type", "content_type"]);
  const likesColumn = detectColumn(data, ["likes", "like_count", "likes_count"]);
  const commentsColumn = detectColumn(data, ["comments", "comment_count", "comments_count"]);
  const savesColumn = detectColumn(data, ["saves", "save_count", "saves_count"]);
  const reachColumn = detectColumn(data, ["reach", "reach_count", "impressions"]);

  if (!mediaTypeColumn) return [];

  const typeStats: { [type: string]: { totalEngagement: number; totalReach: number; count: number } } = {};

  data.forEach((row) => {
    const type = String(row[mediaTypeColumn] || "").trim().toUpperCase();
    if (!type) return;

    const likes = Number(row[likesColumn || ""] || 0);
    const comments = Number(row[commentsColumn || ""] || 0);
    const saves = Number(row[savesColumn || ""] || 0);
    const reach = Number(row[reachColumn || ""] || 0);
    const engagement = likes + comments + saves;

    if (!typeStats[type]) {
      typeStats[type] = { totalEngagement: 0, totalReach: 0, count: 0 };
    }

    typeStats[type].totalEngagement += engagement;
    typeStats[type].totalReach += reach;
    typeStats[type].count++;
  });

  return Object.entries(typeStats)
    .map(([name, stats]) => ({
      name: name === "IMAGE" ? "صورة" : name === "VIDEO" ? "فيديو" : name === "REEL" ? "ريل" : name,
      value: stats.totalReach > 0 ? (stats.totalEngagement / stats.totalReach) * 100 : 0, // Engagement rate
    }))
    .sort((a, b) => b.value - a.value);
}

// Best Posting Time (by hour)
export function getBestPostingTime(data: InstagramData[]): ChartData[] {
  const timestampColumn = detectColumn(data, ["timestamp", "created_time", "date", "post_date"]);
  const likesColumn = detectColumn(data, ["likes", "like_count", "likes_count"]);
  const commentsColumn = detectColumn(data, ["comments", "comment_count", "comments_count"]);
  const savesColumn = detectColumn(data, ["saves", "save_count", "saves_count"]);

  if (!timestampColumn) return [];

  const hourStats: { [hour: string]: { engagement: number; count: number } } = {};

  data.forEach((row) => {
    const date = parseDate(String(row[timestampColumn] || ""));
    if (!date) return;

    const hour = date.getHours().toString().padStart(2, "0");
    const likes = Number(row[likesColumn || ""] || 0);
    const comments = Number(row[commentsColumn || ""] || 0);
    const saves = Number(row[savesColumn || ""] || 0);
    const engagement = likes + comments + saves;

    if (!hourStats[hour]) {
      hourStats[hour] = { engagement: 0, count: 0 };
    }

    hourStats[hour].engagement += engagement;
    hourStats[hour].count++;
  });

  // Calculate average engagement per hour
  return Object.entries(hourStats)
    .map(([hour, stats]) => ({
      name: `${hour}:00`,
      value: stats.count > 0 ? stats.engagement / stats.count : 0,
    }))
    .sort((a, b) => Number(a.name.split(":")[0]) - Number(b.name.split(":")[0]));
}

// Reach vs Engagement (Scatter plot data)
export function getReachVsEngagement(data: InstagramData[]): ScatterData[] {
  const likesColumn = detectColumn(data, ["likes", "like_count", "likes_count"]);
  const commentsColumn = detectColumn(data, ["comments", "comment_count", "comments_count"]);
  const savesColumn = detectColumn(data, ["saves", "save_count", "saves_count"]);
  const reachColumn = detectColumn(data, ["reach", "reach_count", "impressions"]);
  const mediaIdColumn = detectColumn(data, ["media_id", "id", "post_id"]);

  if (!reachColumn) return [];

  return data
    .map((row) => {
      const likes = Number(row[likesColumn || ""] || 0);
      const comments = Number(row[commentsColumn || ""] || 0);
      const saves = Number(row[savesColumn || ""] || 0);
      const reach = Number(row[reachColumn || ""] || 0);
      const engagement = likes + comments + saves;
      const name = String(row[mediaIdColumn || ""] || "").substring(0, 8) || "Post";

      return {
        name,
        reach,
        engagement,
      };
    })
    .filter((item) => item.reach > 0 || item.engagement > 0);
}

// Get Instagram posts for table
export function getInstagramPosts(data: InstagramData[]): any[] {
  const mediaIdColumn = detectColumn(data, ["media_id", "id", "post_id"]);
  const mediaTypeColumn = detectColumn(data, ["media_type", "type", "content_type"]);
  const captionColumn = detectColumn(data, ["caption", "text", "description"]);
  const likesColumn = detectColumn(data, ["likes", "like_count", "likes_count"]);
  const commentsColumn = detectColumn(data, ["comments", "comment_count", "comments_count"]);
  const savesColumn = detectColumn(data, ["saves", "save_count", "saves_count"]);
  const reachColumn = detectColumn(data, ["reach", "reach_count", "impressions"]);
  const timestampColumn = detectColumn(data, ["timestamp", "created_time", "date", "post_date"]);

  return data.map((row) => {
    const likes = Number(row[likesColumn || ""] || 0);
    const comments = Number(row[commentsColumn || ""] || 0);
    const saves = Number(row[savesColumn || ""] || 0);
    const reach = Number(row[reachColumn || ""] || 0);
    const engagement = likes + comments + saves;
    const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;

    return {
      mediaId: String(row[mediaIdColumn || ""] || ""),
      contentType: String(row[mediaTypeColumn || ""] || "").toUpperCase(),
      caption: String(row[captionColumn || ""] || "").substring(0, 100),
      likes,
      comments,
      saves,
      reach,
      engagementRate: engagementRate.toFixed(2),
      postDate: row[timestampColumn || ""] || "",
    };
  });
}

