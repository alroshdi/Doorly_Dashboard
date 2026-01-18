"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from "@/lib/analytics";
import { 
  processChartData, 
  formatNumber, 
  formatPercentage, 
  generateAnalyticsSummary,
  calculateTotal 
} from "@/lib/chart-utils";
import { getLanguage } from "@/lib/i18n";

interface DonutChartComponentProps {
  data: ChartData[];
  title: string;
  subtitle?: string;
  insight?: string | null;
}

export function DonutChartComponent({ data, title, subtitle, insight }: DonutChartComponentProps) {
  const lang = getLanguage();
  const isRTL = lang === "ar";

  // Process data with colors and percentages
  const processedData = processChartData(data, 10, true, lang);
  
  // If no data, show empty state
  if (processedData.length === 0) {
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

  const total = calculateTotal(processedData);
  
  // Generate analytics summary
  const analyticsSummary = insight || generateAnalyticsSummary(processedData, isRTL);

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        {analyticsSummary && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {analyticsSummary}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`grid grid-cols-1 ${isRTL ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-[1fr_280px]'} gap-4 items-start`}>
          {/* Details Panel */}
          <div className={`space-y-2 ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="text-xs font-semibold text-muted-foreground mb-3 pb-2 border-b border-border">
              {isRTL ? "التفاصيل" : "Details"}
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {processedData.map((item, index) => (
                <div
                  key={`detail-${index}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-bold truncate" dir="auto">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" dir="ltr">
                    <span className="text-xs text-muted-foreground">
                      {formatPercentage(item.percentage)}
                    </span>
                    <span className="text-sm font-semibold">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {total > 0 && (
              <div className="pt-2 mt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">
                    {isRTL ? "الإجمالي" : "Total"}
                  </span>
                  <span dir="ltr">{formatNumber(total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className={`w-full ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={processedData}
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
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
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
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: '13px',
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const percentage = props.payload?.percentage || 0;
                    return [
                      `${formatNumber(value)} (${formatPercentage(percentage)})`,
                      props.payload?.name || ""
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

