"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { Search } from "lucide-react";
import { RequestData, getRequestsByWilaya } from "@/lib/analytics";

interface TablesProps {
  data: RequestData[];
}

export function Tables({ data }: TablesProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";
  const [searchTerm, setSearchTerm] = useState("");

  // Recent Requests Table
  const recentRequests = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Find unique identifier column (request_id or ref_id)
    const idColumn = Object.keys(data[0] || {}).find(k => 
      k.toLowerCase().includes("request_id") || 
      k.toLowerCase().includes("ref_id") ||
      k.toLowerCase().includes("id")
    );

    // Remove duplicates based on unique identifier
    const uniqueMap = new Map<string, RequestData>();
    data.forEach((row) => {
      let uniqueKey = "";
      if (idColumn) {
        uniqueKey = String(row[idColumn] || "").trim();
      } else {
        // If no ID column, use a combination of all values as unique key
        uniqueKey = JSON.stringify(row);
      }
      
      if (uniqueKey && !uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, row);
      }
    });

    let sorted = Array.from(uniqueMap.values());

    const dateColumn = Object.keys(data[0] || {}).find(k => 
      k.toLowerCase().includes("created_at") || 
      k.toLowerCase().includes("date") ||
      k.toLowerCase().includes("timestamp")
    );

    if (dateColumn) {
      sorted.sort((a, b) => {
        const dateA = new Date(String(a[dateColumn] || 0)).getTime();
        const dateB = new Date(String(b[dateColumn] || 0)).getTime();
        return dateB - dateA;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      sorted = sorted.filter((row) => {
        return Object.values(row).some((val) =>
          String(val).toLowerCase().includes(term)
        );
      });
    }

    return sorted.slice(0, 20);
  }, [data, searchTerm]);

  // Top Areas
  const topAreas = useRequestsByWilaya(data);

  const getColumnValue = (row: RequestData, possibleNames: string[]) => {
    const key = Object.keys(row).find(k =>
      possibleNames.some(name => k.toLowerCase().includes(name.toLowerCase()))
    );
    return key ? String(row[key] || "") : "";
  };

  return (
    <div className="space-y-6">
      {/* Recent Requests Table */}
      <Card className="animate-fade-in hover-lift border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95 transition-all duration-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="group-hover:text-primary transition-colors duration-300">{t.tables.recentRequests}</CardTitle>
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              <Input
                placeholder={t.tables.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8 transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 || !data || data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse-slow">
              {t.tables.noData}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border animate-fade-in -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/30">
                      {data[0] && Object.keys(data[0]).slice(0, 8).map((key, idx) => (
                        <th 
                          key={key} 
                          className={`text-right p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground transition-colors duration-300 whitespace-nowrap ${isRTL ? "text-right" : "text-left"}`}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-border/50 hover:bg-primary/5 transition-all duration-300"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        {data[0] && Object.keys(data[0]).slice(0, 8).map((key) => (
                          <td key={key} className={`p-2 sm:p-3 text-xs sm:text-sm transition-colors duration-200 ${isRTL ? "text-right" : "text-left"}`}>
                            {String(row[key] || "").slice(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Areas Table */}
      <Card className="animate-fade-in hover-lift border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95 transition-all duration-500">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors duration-300">{t.tables.topAreas}</CardTitle>
        </CardHeader>
        <CardContent>
          {topAreas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse-slow">
              {t.tables.noData}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border animate-fade-in">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/30">
                    <th className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground transition-colors duration-300 ${isRTL ? "text-right" : "text-left"}`}>
                      {isRTL ? "المنطقة" : "Area"}
                    </th>
                    <th className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold text-foreground transition-colors duration-300 ${isRTL ? "text-right" : "text-left"}`}>
                      {isRTL ? "عدد الطلبات" : "Requests"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topAreas.map((area, idx) => (
                    <tr 
                      key={idx} 
                      className="border-b border-border/50 hover:bg-primary/5 transition-all duration-300"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className={`p-2 sm:p-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${isRTL ? "text-right" : "text-left"}`}>{area.name}</td>
                      <td className={`p-2 sm:p-3 text-xs sm:text-sm ${isRTL ? "text-right" : "text-left"}`}>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 hover:scale-110 hover:shadow-md text-xs sm:text-sm px-2 py-1">
                          {area.value}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function useRequestsByWilaya(data: RequestData[]) {
  return useMemo(() => {
    return getRequestsByWilaya(data);
  }, [data]);
}

