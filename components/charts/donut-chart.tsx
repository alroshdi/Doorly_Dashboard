"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";

interface DonutChartComponentProps {
  data: ChartData[];
  title: string;
}

const COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

export function DonutChartComponent({ data, title }: DonutChartComponentProps) {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  innerRadius={50}
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
                    fontSize: '13px',
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                    return [
                      `${formatNumber(value)} (${percentage}%)`,
                      props.payload.name || ""
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Information Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 rounded-xl p-4 border-2 border-border/50 shadow-lg h-full max-h-[300px] overflow-hidden flex flex-col">
              <h4 className="font-bold text-sm mb-4 text-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Details
              </h4>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
              }}>
                {displayData.map((item, index) => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                  const color = COLORS[index % COLORS.length];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 hover:shadow-md transition-all duration-200 border border-transparent hover:border-primary/20 group"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-primary">{formatNumber(item.value)}</span>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

