"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterData } from "@/lib/analytics";

interface ScatterChartComponentProps {
  data: ScatterData[];
  title: string;
  description?: string;
}

const COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

export function ScatterChartComponent({ data, title, description }: ScatterChartComponentProps) {
  // Filter out zero values
  const filteredData = (data || [])
    .filter(item => item.reach > 0 || item.engagement > 0)
    .slice(0, 100); // Limit to 100 points for performance

  // If no data, show empty state
  const displayData = filteredData.length === 0 
    ? []
    : filteredData;

  // Format numbers with thousand separators
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-DZ').format(num);
  };

  // Calculate insights
  const avgReach = displayData.length > 0 
    ? displayData.reduce((sum, item) => sum + item.reach, 0) / displayData.length 
    : 0;
  const avgEngagement = displayData.length > 0 
    ? displayData.reduce((sum, item) => sum + item.engagement, 0) / displayData.length 
    : 0;
  const insight = displayData.length > 0
    ? `Average reach: ${formatNumber(Math.round(avgReach))}, average engagement: ${formatNumber(Math.round(avgEngagement))}. ${displayData.length} posts analyzed.`
    : 'No data available for analysis.';

  return (
    <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in border border-border/50 bg-card group h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
          {description || insight}
        </p>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%" className="min-h-[200px] sm:min-h-[220px]">
            <ScatterChart
              data={displayData}
              margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
              <XAxis 
                type="number"
                dataKey="reach"
                name="الوصول"
                label={{ value: "الوصول", position: "insideBottom", offset: -5 }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis 
                type="number"
                dataKey="engagement"
                name="التفاعل"
                label={{ value: "التفاعل", angle: -90, position: "insideLeft" }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(value: any, name: any) => {
                  if (name === "الوصول") {
                    return [formatNumber(value), "الوصول"];
                  } else if (name === "التفاعل") {
                    return [formatNumber(value), "التفاعل"];
                  }
                  return [formatNumber(value), name];
                }}
                labelFormatter={(label) => `Post: ${label}`}
                cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
              />
              <Scatter 
                name="Posts" 
                data={displayData} 
                fill="#3B82F6"
                animationDuration={800}
              >
                {displayData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    opacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

