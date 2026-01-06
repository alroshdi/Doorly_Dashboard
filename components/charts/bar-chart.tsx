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

  return (
    <Card className="transition-all duration-500 hover:shadow-xl animate-fade-in hover-lift border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95 group">
      <CardHeader>
        <CardTitle className="group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2 order-1">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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
          
          {/* Information Panel - Takes 1 column */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 rounded-xl p-3 sm:p-4 border-2 border-border/50 shadow-lg h-full max-h-[250px] sm:max-h-[300px] overflow-hidden flex flex-col">
              <h4 className="font-bold text-xs sm:text-sm mb-3 sm:mb-4 text-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Details
              </h4>
              <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-1 pr-1 sm:pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
              }}>
                {displayData.map((item, index) => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                  const color = COLORS[index % COLORS.length];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-primary/5 hover:shadow-md transition-all duration-200 border border-transparent hover:border-primary/20 group"
                    >
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
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

