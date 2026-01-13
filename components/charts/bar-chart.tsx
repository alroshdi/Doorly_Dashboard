"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";

interface BarChartComponentProps {
  data: ChartData[];
  title: string;
}

const COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

export function BarChartComponent({ data, title }: BarChartComponentProps) {
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
          <BarChart 
            data={displayData}
            margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              hide={true}
            />
            <YAxis 
              tickFormatter={(value) => formatNumber(value)}
              width={60}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontSize: '13px',
              }}
              formatter={(value: any, name: any, props: any) => {
                if (!props || !props.payload) return [formatNumber(value || 0), ""];
                const label = props.payload.name || "";
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return [
                  `${formatNumber(value || 0)} (${percentage}%)`,
                  String(label).trim() || ""
                ];
              }}
              labelFormatter={(label) => ""}
            />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={true}
              label={(props: any) => {
                const { x, y, width, value, payload } = props;
                if (!payload || !payload.name || value === undefined) {
                  return <text x={0} y={0} style={{ display: 'none' }} />;
                }
                return (
                  <text
                    x={x + width / 2}
                    y={y - 8}
                    fill="#1f2937"
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {formatNumber(value)}
                  </text>
                );
              }}
            >
              {displayData.map((entry, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={color}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e: any) => {
                      if (e.target) {
                        e.target.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15)) brightness(1.05)';
                        e.target.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e: any) => {
                      if (e.target) {
                        e.target.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))';
                        e.target.style.opacity = '1';
                      }
                    }}
                  />
                );
              })}
            </Bar>
            <Legend
              verticalAlign="bottom"
              align="center"
              formatter={(value, entry: any) => {
                if (!entry || !entry.payload || !entry.payload.name) return "";
                const name = String(entry.payload.name).trim();
                const val = entry.payload.value || 0;
                const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return `${name}: ${formatNumber(val)} (${percentage}%)`;
              }}
              wrapperStyle={{ paddingTop: '24px', fontSize: '13px', fontWeight: '500' }}
              iconType="square"
              iconSize={14}
              payload={displayData.map((entry, index) => ({
                value: entry.name,
                type: 'square',
                id: `legend-${index}`,
                color: COLORS[index % COLORS.length],
                payload: {
                  ...entry,
                  strokeDasharray: 0
                }
              }))}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

