"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateRangeSlicerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label: string;
  isRTL?: boolean;
}

export function DateRangeSlicer({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  isRTL = false,
}: DateRangeSlicerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!containerRef.current) return;
      
      // Don't close if clicking inside the container or date inputs
      if (containerRef.current.contains(target)) {
        // Allow date picker calendar to work
        if (target.tagName === 'INPUT' || 
            target.closest('input[type="date"]') ||
            target.closest('.date-picker-container')) {
          return;
        }
      }
      
      // Close if clicking outside
      if (!containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a delay to allow date picker to open
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside, true);
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }
  }, [isOpen]);

  const formatDisplayDate = (date: string) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toLocaleDateString(isRTL ? "ar-DZ" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const clearDates = () => {
    onStartDateChange("");
    onEndDateChange("");
  };

  const hasDates = startDate || endDate;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative" ref={containerRef}>
        <div
          className={cn(
            "flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 active:scale-[0.98]",
            isOpen && "ring-2 ring-primary border-primary shadow-md bg-accent/30"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
        >
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 text-sm min-w-0">
            {startDate && endDate ? (
              <span className="truncate">
                {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
              </span>
            ) : startDate ? (
              <span className="truncate">{formatDisplayDate(startDate)}</span>
            ) : (
              <span className="text-muted-foreground">{isRTL ? "اختر التاريخ" : "Select Date"}</span>
            )}
          </div>
          {hasDates && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                clearDates();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isOpen && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border-2 rounded-xl shadow-xl z-50 min-w-[320px] animate-slide-down backdrop-blur-sm date-picker-container"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{label}</h4>
                {hasDates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearDates();
                    }}
                  >
                    {isRTL ? "مسح" : "Clear"}
                  </Button>
                )}
              </div>
              
              <div className={cn("grid grid-cols-2 gap-3", isRTL && "grid-cols-2")}>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground block font-medium">
                    {isRTL ? "من" : "From"}
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newStartDate = e.target.value;
                        onStartDateChange(newStartDate);
                        // If new start date is after end date, clear end date
                        if (endDate && newStartDate > endDate) {
                          onEndDateChange("");
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.showPicker?.();
                      }}
                      max={endDate || undefined}
                      className="w-full cursor-pointer"
                      placeholder={isRTL ? "mm/dd/yyyy" : "mm/dd/yyyy"}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground block font-medium">
                    {isRTL ? "إلى" : "To"}
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newEndDate = e.target.value;
                        onEndDateChange(newEndDate);
                        // If new end date is before start date, clear start date
                        if (startDate && newEndDate < startDate) {
                          onStartDateChange("");
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.showPicker?.();
                      }}
                      min={startDate || undefined}
                      className="w-full cursor-pointer"
                      placeholder={isRTL ? "mm/dd/yyyy" : "mm/dd/yyyy"}
                    />
                  </div>
                </div>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const today = new Date().toISOString().split('T')[0];
                    onStartDateChange(today);
                    onEndDateChange(today);
                  }}
                >
                  {isRTL ? "اليوم" : "Today"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const today = new Date();
                    const lastWeek = new Date(today);
                    lastWeek.setDate(today.getDate() - 7);
                    onStartDateChange(lastWeek.toISOString().split('T')[0]);
                    onEndDateChange(today.toISOString().split('T')[0]);
                  }}
                >
                  {isRTL ? "آخر 7 أيام" : "Last 7 Days"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const today = new Date();
                    const lastMonth = new Date(today);
                    lastMonth.setMonth(today.getMonth() - 1);
                    onStartDateChange(lastMonth.toISOString().split('T')[0]);
                    onEndDateChange(today.toISOString().split('T')[0]);
                  }}
                >
                  {isRTL ? "آخر شهر" : "Last Month"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

