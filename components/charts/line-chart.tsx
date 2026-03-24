"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";
import { parseISO, format as formatDate, parse, isValid } from "date-fns";
import { getLanguage, getTranslations } from "@/lib/i18n";
import { formatNumber } from "@/lib/chart-utils";

interface LineChartComponentProps {
  data: ChartData[];
  title: string;
  subtitle?: string;
  insight?: string | null;
  /** Shown in tooltip and Y-axis — must match the metric (not "requests" unless this chart is requests). */
  valueLabel?: string;
  /** Max points to show (most recent). */
  maxPoints?: number;
  /** Use straight segments between daily points instead of smooth curves. */
  lineType?: "linear" | "monotone";
}

function tryParseChartDate(raw: string): Date | null {
  const s = String(raw).trim();
  if (!s) return null;
  try {
    const iso = parseISO(s);
    if (isValid(iso)) return iso;
  } catch {
    /* continue */
  }
  for (const fmt of ["MM/dd/yyyy", "M/d/yyyy", "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd"]) {
    const d = parse(s, fmt, new Date());
    if (isValid(d)) return d;
  }
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const d = parseISO(`${ymd[1]}-${ymd[2]}-${ymd[3]}`);
    if (isValid(d)) return d;
  }
  return null;
}

function formatTickDate(raw: string, lang: "ar" | "en"): string {
  const d = tryParseChartDate(raw);
  if (d) {
    return formatDate(d, lang === "ar" ? "dd/MM" : "MM/dd");
  }
  const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return `${monthMatch[2]}/${monthMatch[1].slice(2)}`;
  }
  return raw.length > 12 ? raw.slice(0, 12) + "…" : raw;
}

function formatTooltipDate(raw: string, lang: "ar" | "en"): string {
  const d = tryParseChartDate(raw);
  if (d) {
    return formatDate(d, lang === "ar" ? "dd/MM/yyyy" : "MM/dd/yyyy");
  }
  return String(raw);
}

export function LineChartComponent({
  data,
  title,
  subtitle,
  insight,
  valueLabel,
  maxPoints = 30,
  lineType = "linear",
}: LineChartComponentProps) {
  const lang = getLanguage();
  const isRTL = lang === "ar";
  const t = getTranslations(lang);
  const seriesLabel = valueLabel ?? t.charts.axisValue;

  const filteredData = (data || [])
    .filter((item) => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-maxPoints);

  if (filteredData.length === 0) {
    return (
      <Card className="h-full w-full min-w-0 border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-center text-muted-foreground py-8">
            {isRTL ? "لا توجد بيانات متاحة" : "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayData = filteredData;

  const lastDate = displayData.length > 0 ? displayData[displayData.length - 1] : null;
  const year = lastDate
    ? (() => {
        const d = tryParseChartDate(lastDate.name);
        return d ? formatDate(d, "yyyy") : "";
      })()
    : "";

  const calculatedInsight =
    insight ||
    (() => {
      if (displayData.length === 0 || displayData[0].value === 0) return null;
      const values = displayData.filter((d) => d.value > 0).map((d) => d.value);
      if (values.length === 0) return null;
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const maxDate = displayData.find((d) => d.value === maxValue)?.name || "";
      const maxDateFmt = formatTooltipDate(maxDate, lang);
      const trend =
        maxValue > minValue ? (isRTL ? "زيادة" : "Increase") : isRTL ? "انخفاض" : "Decrease";
      return isRTL
        ? `الذروة: ${formatNumber(maxValue)} في ${maxDateFmt}. الاتجاه: ${trend}`
        : `Peak: ${formatNumber(maxValue)} on ${maxDateFmt}. Trend: ${trend}`;
    })();

  const muted = "hsl(var(--muted-foreground))";

  return (
    <Card className="h-full w-full min-w-0 border border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        {calculatedInsight && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">{calculatedInsight}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative" dir="ltr">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={displayData}
              margin={{ top: 8, right: 12, left: 4, bottom: 28 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={`${muted} / 0.2`} />
              <XAxis
                dataKey="name"
                tick={{ fill: muted, fontSize: 10 }}
                tickFormatter={(v) => formatTickDate(String(v), lang)}
                interval="preserveStartEnd"
                angle={displayData.length > 8 ? -35 : 0}
                textAnchor={displayData.length > 8 ? "end" : "middle"}
                height={displayData.length > 8 ? 52 : 28}
                axisLine={{ stroke: `${muted} / 0.35` }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: muted, fontSize: 11 }}
                tickFormatter={(value) => formatNumber(value)}
                width={56}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                label={{
                  value: seriesLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: muted, fontSize: 11, fontWeight: 500 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.96)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                  marginBottom: "4px",
                  fontSize: "12px",
                }}
                itemStyle={{
                  color: "#3B82F6",
                  fontWeight: 600,
                  fontSize: "12px",
                }}
                labelFormatter={(label) => formatTooltipDate(String(label), lang)}
                formatter={(value: number | string) => [
                  formatNumber(typeof value === "number" ? value : Number(value)),
                  seriesLabel,
                ]}
                cursor={{ stroke: "#3B82F6", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.35 }}
                animationDuration={200}
              />
              <Line
                type={lineType}
                dataKey="value"
                name={seriesLabel}
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "#3B82F6",
                  strokeWidth: 1.5,
                  stroke: "#ffffff",
                }}
                activeDot={{
                  r: 6,
                  fill: "#2563EB",
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
                animationDuration={500}
                animationEasing="ease-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
          {year && (
            <div className="text-center text-xs font-medium text-muted-foreground mt-0.5" dir={isRTL ? "rtl" : "ltr"}>
              {isRTL ? `السنة: ${year}` : `Year: ${year}`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
