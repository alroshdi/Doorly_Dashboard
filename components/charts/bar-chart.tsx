"use client";

import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";

interface BarChartComponentProps {
  data: ChartData[];
  title: string;
  unit?: string;
  unitImage?: string;
}

const COLORS = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#10B981", "#06B6D4", "#F43F5E",
  "#A855F7", "#EF4444"
];

export function BarChartComponent({ data, title, unit, unitImage }: BarChartComponentProps) {
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
    ? `${topItem.name} leads with ${formatNumber(topItem.value)}${unitImage ? ' [Bold]' : (unit ? ` ${unit}` : '')}, ${((topItem.value / total) * 100).toFixed(1)}% of total. ${secondItem.name} follows at ${((secondItem.value / total) * 100).toFixed(1)}%.`
    : topItem 
    ? `${topItem.name} represents ${((topItem.value / total) * 100).toFixed(1)}% of the total.`
    : 'No data available for analysis.';

  return (
    <Card className="transition-all duration-300 hover:shadow-lg animate-fade-in border border-border/50 bg-card group h-full flex flex-col">
      {/* Compact header with subtitle */}
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
        {/* Analytical insight: 1-2 lines explaining the data */}
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{insight}</p>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 flex-1 flex flex-col">
        {/* Compact grid: Reduced gaps for tighter layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 flex-1 min-h-0">
          {/* Chart - Uniform height for consistency */}
          <div className="lg:col-span-2 order-1 flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%" className="min-h-[200px] sm:min-h-[220px]">
            <BarChart 
            data={displayData}
            margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              hide={true}
            />
            <YAxis 
              tickFormatter={(value) => `${formatNumber(value)}${unit ? ` ${unit}` : ''}`}
              width={unit ? 70 : 50}
              tickMargin={8}
              tick={{ fontSize: 11 }}
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
                const unitDisplay = unitImage ? ' [Bold]' : (unit ? ` ${unit}` : '');
                return [
                  `${formatNumber(value || 0)}${unitDisplay} (${percentage}%)`,
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
          </BarChart>
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
                        className="w-2.5 h-2.5 rounded flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs sm:text-sm font-bold text-primary flex items-center gap-1">
                            {formatNumber(item.value)}
                            {unitImage ? (
                              <Image 
                                src={unitImage} 
                                alt="unit" 
                                width={16} 
                                height={16} 
                                className="inline-block"
                                style={{ width: 'auto', height: '0.9em' }}
                              />
                            ) : unit && (
                              <span>{unit}</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 sm:px-2 py-0.5 rounded-full">{percentage}%</span>
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

