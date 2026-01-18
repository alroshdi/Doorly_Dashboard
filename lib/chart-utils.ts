import { ChartData } from "./analytics";

export const CHART_COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

/**
 * Translation mappings for common category names
 */
const categoryTranslations: Record<string, { ar: string; en: string }> = {
  // Sources
  "api": { ar: "API", en: "API" },
  "web": { ar: "الويب", en: "Web" },
  "chatbot": { ar: "شات بوت", en: "Chatbot" },
  "whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "app": { ar: "التطبيق", en: "App" },
  
  // Usage types
  "buy": { ar: "شراء", en: "Buy" },
  "rent": { ar: "إستئجار", en: "Rent" },
  "شراء": { ar: "شراء", en: "Buy" },
  "إستئجار": { ar: "إستئجار", en: "Rent" },
  "purchase": { ar: "شراء", en: "Purchase" },
  "lease": { ar: "إستئجار", en: "Lease" },
  
  // Property types (common ones)
  "apartment": { ar: "شقة", en: "Apartment" },
  "villa": { ar: "فيلا", en: "Villa" },
  "land": { ar: "أرض", en: "Land" },
  "commercial": { ar: "تجاري", en: "Commercial" },
  "office": { ar: "مكتب", en: "Office" },
  "building": { ar: "بناية", en: "Building" },
  "shop": { ar: "محل", en: "Shop" },
  "farm": { ar: "مزرعة", en: "Farm" },
  "industrial": { ar: "صناعي", en: "Industrial" },
  
  // Status
  "active": { ar: "نشط", en: "Active" },
  "pending": { ar: "قيد المراجعة", en: "Pending" },
  "cancelled": { ar: "ملغي", en: "Cancelled" },
  "paymentPending": { ar: "قيد الدفع", en: "Payment Pending" },
};

/**
 * Translate category name based on current language
 */
export function translateCategoryName(name: string, lang: "ar" | "en" = "ar"): string {
  if (!name) return name;
  
  const normalizedName = name.trim().toLowerCase();
  
  // Check if we have a translation
  const translation = categoryTranslations[normalizedName] || categoryTranslations[name];
  if (translation) {
    return translation[lang];
  }
  
  // If the name is already in the target language, return as-is
  // Otherwise, return the original name
  return name;
}

export interface ProcessedChartData extends ChartData {
  color: string;
  percentage: number;
}

/**
 * Calculate total from chart data
 */
export function calculateTotal(data: ChartData[]): number {
  return (data || []).reduce((sum, item) => sum + (item.value || 0), 0);
}

/**
 * Calculate percentage for each data point
 */
export function calculatePercentages(data: ChartData[], total: number): number[] {
  if (total === 0) return data.map(() => 0);
  return data.map(item => ((item.value || 0) / total) * 100);
}

/**
 * Process and prepare chart data with colors and percentages
 */
export function processChartData(
  data: ChartData[],
  maxItems: number = 10,
  sortDescending: boolean = true,
  lang?: "ar" | "en"
): ProcessedChartData[] {
  // Filter out zero values
  const filtered = (data || [])
    .filter(item => (item.value || 0) > 0);

  // Sort data
  const sorted = sortDescending
    ? [...filtered].sort((a, b) => (b.value || 0) - (a.value || 0))
    : [...filtered].sort((a, b) => (a.value || 0) - (b.value || 0));

  // Limit to max items
  const limited = sorted.slice(0, maxItems);

  // Calculate total
  const total = calculateTotal(limited);

  // Add colors and percentages, and translate names
  return limited.map((item, index) => ({
    ...item,
    name: translateCategoryName(item.name, lang),
    color: CHART_COLORS[index % CHART_COLORS.length],
    percentage: total > 0 ? ((item.value || 0) / total) * 100 : 0,
  }));
}

/**
 * Format number with thousand separators (Arabic locale)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-DZ').format(num);
}

/**
 * Format percentage with 1 decimal place
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Generate analytical summary from chart data
 */
export function generateAnalyticsSummary(
  data: ProcessedChartData[],
  isRTL: boolean = true
): string | null {
  if (!data || data.length === 0) return null;

  const total = calculateTotal(data);
  if (total === 0) return null;

  const topItem = data[0];
  const topPercentage = topItem.percentage;

  // Find if there's a significant gap between top and second
  const secondItem = data[1];
  const gap = secondItem ? topPercentage - secondItem.percentage : topPercentage;

  // Generate summary based on data characteristics
  if (gap > 30) {
    return isRTL
      ? `${topItem.name} يهيمن على التوزيع بنسبة ${formatPercentage(topPercentage)}`
      : `${topItem.name} dominates the distribution with ${formatPercentage(topPercentage)}`;
  } else if (gap > 15) {
    return isRTL
      ? `${topItem.name} يحتل المرتبة الأولى بنسبة ${formatPercentage(topPercentage)} من الإجمالي`
      : `${topItem.name} ranks first with ${formatPercentage(topPercentage)} of total`;
  } else if (data.length === 1) {
    return isRTL
      ? `فئة واحدة فقط: ${topItem.name} (${formatNumber(topItem.value)})`
      : `Single category: ${topItem.name} (${formatNumber(topItem.value)})`;
  } else {
    return isRTL
      ? `التوزيع متوازن نسبياً، ${topItem.name} في المقدمة بنسبة ${formatPercentage(topPercentage)}`
      : `Relatively balanced distribution, ${topItem.name} leads with ${formatPercentage(topPercentage)}`;
  }
}

