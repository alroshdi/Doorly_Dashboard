"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";
import { parseISO, format as formatDate } from "date-fns";
import { getLanguage } from "@/lib/i18n";
import { formatNumber } from "@/lib/chart-utils";

interface LineChartComponentProps {
  data: ChartData[];
  title: string;
  subtitle?: string;
  insight?: string | null;
}

export function LineChartComponent({ data, title, subtitle, insight }: LineChartComponentProps) {
  const lang = getLanguage();
  const isRTL = lang === "ar";

  // Filter out zero values and limit to top 10 for time-based data
  const filteredData = (data || [])
    .filter(item => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-10); // Last 10 for time series

  // If no data, show empty state
  if (filteredData.length === 0) {
    return (
      <Card className="border border-border bg-card">
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

  // Find the last date with data (value > 0)
  const lastDateWithData = displayData
    .filter(item => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .pop();

  // Get the last date in the dataset (even if value is 0)
  const lastDate = displayData.length > 0 ? displayData[displayData.length - 1] : null;

  // Extract year from the first date (assuming all dates are in the same year)
  const year = lastDate ? (() => {
    try {
      const date = parseISO(lastDate.name);
      if (!isNaN(date.getTime())) {
        return formatDate(date, "yyyy");
      }
    } catch {
      // Try to extract year from string format
      const match = lastDate.name.match(/^(\d{4})/);
      return match ? match[1] : "";
    }
    return "";
  })() : "";

  // Format date labels to show only day and month
  const formatXAxisLabel = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      if (!isNaN(date.getTime())) {
        return formatDate(date, "dd-MM");
      }
    } catch {
      // If parsing fails, try to extract day and month from string
      const match = tickItem.match(/^\d{4}-(\d{2})-(\d{2})$/);
      if (match) {
        return `${match[2]}-${match[1]}`;
      }
      // For monthly format (yyyy-MM)
      const monthMatch = tickItem.match(/^\d{4}-(\d{2})$/);
      if (monthMatch) {
        return monthMatch[1];
      }
    }
    return tickItem;
  };

  // Calculate insights if not provided
  const calculatedInsight = insight || (() => {
    if (displayData.length === 0 || displayData[0].value === 0) return null;
    const values = displayData.filter(d => d.value > 0).map(d => d.value);
    if (values.length === 0) return null;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxDate = displayData.find(d => d.value === maxValue)?.name || "";
    const trend = maxValue > minValue ? (isRTL ? "زيادة" : "Increase") : (isRTL ? "انخفاض" : "Decrease");
    return isRTL
      ? `الذروة: ${formatNumber(maxValue)} في ${maxDate}. الاتجاه: ${trend}`
      : `Peak: ${formatNumber(maxValue)} on ${maxDate}. Trend: ${trend}`;
  })();

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        {calculatedInsight && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {calculatedInsight}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
              <XAxis 
                dataKey="name" 
                hide={true}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value)}
                width={70}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                labelStyle={{
                  color: 'hsl(var(--foreground))',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}
                itemStyle={{
                  color: '#3B82F6',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
                labelFormatter={(label) => {
                  try {
                    const date = parseISO(String(label));
                    if (!isNaN(date.getTime())) {
                      return formatDate(date, "dd-MM-yyyy");
                    }
                  } catch {}
                  return String(label);
                }}
                formatter={(value: any) => {
                  return [formatNumber(value), isRTL ? 'الطلبات' : 'Requests'];
                }}
                cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.5 }}
                animationDuration={200}
              />
              <Legend 
                verticalAlign="top" 
                align="left"
                formatter={() => isRTL ? "الطلبات" : "Requests"}
                iconType="line"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ 
                  r: 5, 
                  fill: '#3B82F6',
                  strokeWidth: 2,
                  stroke: '#ffffff'
                }}
                activeDot={{ 
                  r: 10, 
                  fill: '#2563EB',
                  strokeWidth: 3,
                  stroke: '#ffffff',
                  style: { 
                    filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5))',
                    transition: 'all 0.3s ease'
                  }
                }}
                animationDuration={800}
                animationEasing="ease-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
          {year && (
            <div className="text-center text-sm font-medium text-muted-foreground mt-1">
              {year}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

