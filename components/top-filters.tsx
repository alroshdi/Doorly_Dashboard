"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeSlicer } from "@/components/ui/date-range-slicer";
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
    <Card className="mb-6 animate-fade-in hover-lift border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95 transition-all duration-500">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {/* Date Range Slicer */}
          <div className="xl:col-span-2">
            <DateRangeSlicer
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => {
                updateFilter("startDate", date);
                updateFilter("quickFilter", ""); // Clear quick filter when manually selecting dates
              }}
              onEndDateChange={(date) => {
                updateFilter("endDate", date);
                updateFilter("quickFilter", ""); // Clear quick filter when manually selecting dates
              }}
              label={t.filters.dateRange}
              isRTL={isRTL}
            />
          </div>

          {/* Quick Date Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.filters.quickFilter}</label>
            <Select
              value={filters.quickFilter}
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickFilter(e.target.value);
                } else {
                  updateFilter("quickFilter", "");
                }
              }}
            >
              <option value="">{t.filters.all}</option>
              <option value="last7days">{t.filters.last7days}</option>
              <option value="lastMonth">{t.filters.lastMonth}</option>
              <option value="lastYear">{t.filters.lastYear}</option>
            </Select>
          </div>

          {/* Wilaya */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.filters.wilaya}</label>
            <Select
              value={filters.wilaya}
              onChange={(e) => updateFilter("wilaya", e.target.value)}
            >
              <option value="">{t.filters.all}</option>
              {wilayas.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </Select>
          </div>

          {/* Request Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.filters.requestType}</label>
            <Select
              value={filters.requestType}
              onChange={(e) => updateFilter("requestType", e.target.value)}
            >
              <option value="">{t.filters.all}</option>
              {requestTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.filters.propertyType}</label>
            <Select
              value={filters.propertyType}
              onChange={(e) => updateFilter("propertyType", e.target.value)}
            >
              <option value="">{t.filters.all}</option>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.filters.source}</label>
            <Select
              value={filters.source}
              onChange={(e) => updateFilter("source", e.target.value)}
            >
              <option value="">{t.filters.all}</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.filters.status}</label>
            <Select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="">{t.filters.all}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            {isRTL ? "مسح الفلاتر" : "Clear Filters"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

