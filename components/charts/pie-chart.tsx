"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";

interface PieChartComponentProps {
  data: ChartData[];
  title: string;
}

const COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

export function PieChartComponent({ data, title }: PieChartComponentProps) {
  // Filter out zero values and limit to top 10
  const filteredData = (data || [])
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // If no data, show a single "0" value
  const displayData = filteredData.length === 0 
    ? [{ name: "No Data", value: 0 }]
    : filteredData;

  // Format numbers with thousand separators
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-DZ').format(num);
  };

  const total = displayData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="transition-all duration-500 hover:shadow-xl animate-fade-in hover-lift border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95 group">
      <CardHeader>
        <CardTitle className="group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={true}
            >
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e: any) => {
                    if (e.target) {
                      e.target.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) brightness(1.1)';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e: any) => {
                    if (e.target) {
                      e.target.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
              formatter={(value: any, name: any, props: any) => {
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return [
                  `${formatNumber(value)} (${percentage}%)`,
                  props.payload.name || ""
                ];
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              formatter={(value, entry: any) => {
                const val = entry.payload.value || 0;
                const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return `${entry.payload.name || ""}: ${formatNumber(val)} (${percentage}%)`;
              }}
              wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: '500' }}
              iconType="circle"
              iconSize={10}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

