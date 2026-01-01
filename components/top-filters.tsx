"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations, getLanguage, type Language } from "@/lib/i18n";
import { format } from "date-fns";

export interface FilterState {
  startDate: string;
  endDate: string;
  quickFilter: string; // "last7days" | "lastMonth" | "lastYear" | ""
  wilaya: string;
  requestType: string;
  propertyType: string;
  source: string;
  status: string;
}

interface TopFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  data: any[];
}

export function TopFilters({ filters, onFiltersChange, data }: TopFiltersProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  // Extract unique values from city_name_ar column
  const wilayas = Array.from(new Set((data || []).map((row) => {
    // Prioritize city_name_ar column, fallback to wilaya/area if not found
    if (row.city_name_ar !== undefined && row.city_name_ar !== null) {
      return String(row.city_name_ar || "").trim();
    }
    const col = Object.keys(row || {}).find(k => k.toLowerCase().includes("wilaya") || k.toLowerCase().includes("area"));
    return col ? String(row[col] || "").trim() : "";
  }).filter(Boolean))).sort((a, b) => {
    // Sort alphabetically based on language
    return isRTL ? a.localeCompare(b, 'ar') : a.localeCompare(b, 'en');
  });

  // Extract request types from req_type_ar column
  const requestTypes = Array.from(new Set((data || []).map((row) => {
    // Prioritize req_type_ar column
    if (row.req_type_ar !== undefined && row.req_type_ar !== null) {
      return String(row.req_type_ar || "").trim();
    }
    // Fallback to usage/request_type columns
    const col = Object.keys(row || {}).find(k => k.toLowerCase().includes("usage") || k.toLowerCase().includes("request_type"));
    return col ? String(row[col] || "").trim() : "";
  }).filter(Boolean))).sort((a, b) => {
    // Sort alphabetically based on language
    return isRTL ? a.localeCompare(b, 'ar') : a.localeCompare(b, 'en');
  });

  // Extract property types from property_type_ar column
  const propertyTypes = Array.from(new Set((data || []).map((row) => {
    // Prioritize property_type_ar column
    if (row.property_type_ar !== undefined && row.property_type_ar !== null) {
      return String(row.property_type_ar || "").trim();
    }
    // Fallback to property_type/type columns
    const col = Object.keys(row || {}).find(k => k.toLowerCase().includes("property_type") || k.toLowerCase().includes("type"));
    return col ? String(row[col] || "").trim() : "";
  }).filter(Boolean))).sort((a, b) => {
    // Sort alphabetically based on language
    return isRTL ? a.localeCompare(b, 'ar') : a.localeCompare(b, 'en');
  });

  // Extract sources from data
  const sources = Array.from(new Set((data || []).map((row) => {
    const col = Object.keys(row || {}).find(k => k.toLowerCase().includes("source") || k.toLowerCase().includes("channel"));
    return col ? String(row[col] || "").trim() : "";
  }).filter(Boolean))).sort((a, b) => {
    // Sort alphabetically based on language
    return isRTL ? a.localeCompare(b, 'ar') : a.localeCompare(b, 'en');
  });

  // Extract statuses from status_ar column only
  const statuses = Array.from(new Set((data || []).map((row) => {
    if (row.status_ar !== undefined && row.status_ar !== null) {
      return String(row.status_ar || "").trim();
    }
    return "";
  }).filter(Boolean))).sort((a, b) => {
    // Sort alphabetically based on language
    return isRTL ? a.localeCompare(b, 'ar') : a.localeCompare(b, 'en');
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: "",
      endDate: "",
      quickFilter: "",
      wilaya: "",
      requestType: "",
      propertyType: "",
      source: "",
      status: "",
    });
  };

  const handleQuickFilter = (filterType: string) => {
    const now = new Date();
    let start = "";
    let end = format(new Date(now), "yyyy-MM-dd");

    if (filterType === "last7days") {
      const date = new Date(now);
      date.setDate(date.getDate() - 6); // Last 7 days including today
      start = format(date, "yyyy-MM-dd");
    } else if (filterType === "lastMonth") {
      const date = new Date(now);
      date.setMonth(date.getMonth() - 1);
      start = format(date, "yyyy-MM-dd");
    } else if (filterType === "lastYear") {
      const date = new Date(now);
      date.setFullYear(date.getFullYear() - 1);
      start = format(date, "yyyy-MM-dd");
    }

    onFiltersChange({
      ...filters,
      quickFilter: filterType,
      startDate: start,
      endDate: end,
    });
  };

  return (
    <Card className="mb-4 sm:mb-6 animate-fade-in hover-lift border-2 hover:border-primary/30 bg-gradient-to-br from-card via-card/98 to-card/95 transition-all duration-500 relative shadow-lg hover:shadow-xl" style={{ zIndex: 10 }}>
      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
          {/* Quick Date Filters */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {t.filters.quickFilter}
            </label>
            <Select
              value={filters.quickFilter}
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickFilter(e.target.value);
                } else {
                  updateFilter("quickFilter", "");
                }
              }}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t.filters.all}</option>
              <option value="last7days">{t.filters.last7days}</option>
              <option value="lastMonth">{t.filters.lastMonth}</option>
              <option value="lastYear">{t.filters.lastYear}</option>
            </Select>
          </div>

          {/* Wilaya */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {t.filters.wilaya}
            </label>
            <Select
              value={filters.wilaya}
              onChange={(e) => updateFilter("wilaya", e.target.value)}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t.filters.all}</option>
              {wilayas.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </Select>
          </div>

          {/* Request Type */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {t.filters.requestType}
            </label>
            <Select
              value={filters.requestType}
              onChange={(e) => updateFilter("requestType", e.target.value)}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t.filters.all}</option>
              {requestTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {t.filters.propertyType}
            </label>
            <Select
              value={filters.propertyType}
              onChange={(e) => updateFilter("propertyType", e.target.value)}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t.filters.all}</option>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {t.filters.source}
            </label>
            <Select
              value={filters.source}
              onChange={(e) => updateFilter("source", e.target.value)}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t.filters.all}</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {t.filters.status}
            </label>
            <Select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t.filters.all}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-border/50 flex justify-end">
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-primary/10 hover:text-primary hover:border-primary/50 font-medium px-4 sm:px-6 min-h-[44px] text-sm sm:text-base"
          >
            {isRTL ? "مسح الفلاتر" : "Clear Filters"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

