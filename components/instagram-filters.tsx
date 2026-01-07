"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { format, subDays, subWeeks, subMonths } from "date-fns";

export interface InstagramFilterState {
  startDate: string;
  endDate: string;
  quickFilter: string; // "daily" | "weekly" | "monthly" | ""
  contentType: string; // "IMAGE" | "VIDEO" | "REEL" | ""
  minEngagement: string; // minimum engagement threshold
  sortBy: string; // "engagement" | "reach" | "date" | ""
}

interface InstagramFiltersProps {
  filters: InstagramFilterState;
  onFiltersChange: (filters: InstagramFilterState) => void;
  data: any[];
}

export function InstagramFilters({ filters, onFiltersChange, data }: InstagramFiltersProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  // Extract content types from data
  const contentTypes = Array.from(new Set((data || []).map((row) => {
    const col = Object.keys(row || {}).find(k => 
      k.toLowerCase().includes("media_type") || 
      k.toLowerCase().includes("type") || 
      k.toLowerCase().includes("content_type")
    );
    return col ? String(row[col] || "").trim().toUpperCase() : "";
  }).filter(Boolean))).sort();

  const updateFilter = (key: keyof InstagramFilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: "",
      endDate: "",
      quickFilter: "",
      contentType: "",
      minEngagement: "",
      sortBy: "",
    });
  };

  const handleQuickFilter = (filterType: string) => {
    const today = new Date();
    let startDate = "";
    let endDate = format(today, "yyyy-MM-dd");

    if (filterType === "daily") {
      startDate = format(subDays(today, 7), "yyyy-MM-dd");
    } else if (filterType === "weekly") {
      startDate = format(subWeeks(today, 4), "yyyy-MM-dd");
    } else if (filterType === "monthly") {
      startDate = format(subMonths(today, 6), "yyyy-MM-dd");
    }

    onFiltersChange({
      ...filters,
      quickFilter: filterType,
      startDate,
      endDate,
    });
  };

  return (
    <Card className="mb-4 border-border/50 bg-card">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
          {/* Quick Filter */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              {isRTL ? "الفترة" : "Period"}
            </label>
            <Select
              value={filters.quickFilter}
              onChange={(e) => handleQuickFilter(e.target.value)}
            >
              <option value="">{isRTL ? "الكل" : "All"}</option>
              <option value="daily">{isRTL ? "يومي" : "Daily"}</option>
              <option value="weekly">{isRTL ? "أسبوعي" : "Weekly"}</option>
              <option value="monthly">{isRTL ? "شهري" : "Monthly"}</option>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              {isRTL ? "من تاريخ" : "From Date"}
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              className="h-9"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              {isRTL ? "إلى تاريخ" : "To Date"}
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              className="h-9"
            />
          </div>

          {/* Content Type */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              {isRTL ? "نوع المحتوى" : "Content Type"}
            </label>
            <Select
              value={filters.contentType}
              onChange={(e) => updateFilter("contentType", e.target.value)}
            >
              <option value="">{isRTL ? "الكل" : "All"}</option>
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "IMAGE" ? (isRTL ? "صورة" : "Image") :
                   type === "VIDEO" ? (isRTL ? "فيديو" : "Video") :
                   type === "REEL" ? (isRTL ? "ريل" : "Reel") : type}
                </option>
              ))}
            </Select>
          </div>

          {/* Min Engagement */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              {isRTL ? "أقل تفاعل" : "Min Engagement"}
            </label>
            <Input
              type="number"
              value={filters.minEngagement}
              onChange={(e) => updateFilter("minEngagement", e.target.value)}
              placeholder={isRTL ? "0" : "0"}
              className="h-9"
            />
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              {isRTL ? "ترتيب حسب" : "Sort By"}
            </label>
            <Select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
            >
              <option value="">{isRTL ? "افتراضي" : "Default"}</option>
              <option value="engagement">{isRTL ? "التفاعل" : "Engagement"}</option>
              <option value="reach">{isRTL ? "الوصول" : "Reach"}</option>
              <option value="date">{isRTL ? "التاريخ" : "Date"}</option>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-xs sm:text-sm"
          >
            {isRTL ? "مسح الفلاتر" : "Clear Filters"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

