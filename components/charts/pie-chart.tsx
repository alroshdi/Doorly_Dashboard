"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";

interface PieChartComponentProps {
  data: ChartData[];
  title: string;
  unit?: string;
}

const COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

export function PieChartComponent({ data, title, unit }: PieChartComponentProps) {
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
  
  // Calculate insights for analytical text
  const topItem = displayData.length > 0 ? displayData[0] : null;
  const secondItem = displayData.length > 1 ? displayData[1] : null;
  const insight = topItem && secondItem 
    ? `${topItem.name} dominates with ${((topItem.value / total) * 100).toFixed(1)}% (${formatNumber(topItem.value)}), while ${secondItem.name} accounts for ${((secondItem.value / total) * 100).toFixed(1)}%.`
    : topItem 
    ? `${topItem.name} represents ${((topItem.value / total) * 100).toFixed(1)}% of all entries.`
    : 'No data available for analysis.';

  return (
    <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in border border-border/50 bg-card group">
      {/* Compact header with analytical insight */}
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
        <CardTitle className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
        {/* Analytical insight: 1-2 lines explaining the data */}
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{insight}</p>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3">
        {/* Compact grid: Reduced gaps for tighter layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Chart - Compact height for better density */}
          <div className="lg:col-span-2 order-1">
            <ResponsiveContainer width="100%" height={200} className="sm:h-[220px]">
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
                      `${formatNumber(value)}${unit ? ` ${unit}` : ''} (${percentage}%)`,
                      props.payload.name || ""
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Information Panel - Compact styling */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-border/30 h-full max-h-[200px] sm:max-h-[220px] overflow-hidden flex flex-col">
              <h4 className="font-semibold text-xs mb-2 text-foreground flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary"></div>
                Details
              </h4>
              <div className="space-y-1 overflow-y-auto flex-1 pr-1" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
              }}>
                {displayData.map((item, index) => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                  const color = COLORS[index % COLORS.length];
                  // Compact detail item
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-primary/5 transition-all duration-200 border border-transparent hover:border-primary/20 group"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-bold text-primary">{`${formatNumber(item.value)}${unit ? ` ${unit}` : ''}`}</span>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-1 py-0.5 rounded-full">{percentage}%</span>
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

