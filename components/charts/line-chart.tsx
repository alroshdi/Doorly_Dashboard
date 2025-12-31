"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";
import { parseISO, format as formatDate } from "date-fns";

interface LineChartComponentProps {
  data: ChartData[];
  title: string;
}

export function LineChartComponent({ data, title }: LineChartComponentProps) {
  // Filter out zero values and limit to top 10 for time-based data
  const filteredData = (data || [])
    .filter(item => item.value > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-10); // Last 10 for time series

  // If no data, show a single "0" value
  const displayData = filteredData.length === 0 
    ? [{ name: "No Data", value: 0 }]
    : filteredData;

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

  return (
    <Card className="animate-fade-in hover-lift transition-all duration-500 group border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95">
      <CardContent className="pt-6">
        <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={formatXAxisLabel}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                style={{ transition: 'all 0.3s ease' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format numbers with thousand separators
                  return new Intl.NumberFormat('ar-DZ').format(value);
                }}
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
                  return [new Intl.NumberFormat('ar-DZ').format(value), 'الطلبات'];
                }}
                cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.5 }}
                animationDuration={200}
              />
              <Legend 
                verticalAlign="top" 
                align="left"
                formatter={() => "الطلبات"}
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
                  stroke: '#ffffff',
                  transition: 'all 0.3s ease'
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
            <div className="text-center text-xl font-bold text-foreground mt-1 animate-fade-in">
              {year}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

