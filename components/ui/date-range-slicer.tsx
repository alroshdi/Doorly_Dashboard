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
            target.closest('.date-picker-container') ||
            target.closest('button')) {
          return;
        }
        // Don't close if clicking the main button
        if (target.closest('[role="button"]')) {
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
      }, 100);
      
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
    <div className="space-y-2 relative" style={{ zIndex: 1000, pointerEvents: 'auto' }}>
      <label className="text-sm font-medium text-foreground/90">{label}</label>
      <div className="relative" ref={containerRef} style={{ zIndex: 1000, pointerEvents: 'auto' }}>
        <div
          className={cn(
            "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer",
            "bg-gradient-to-br from-background via-background to-muted/30",
            "hover:from-primary/5 hover:via-primary/5 hover:to-primary/10",
            "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10",
            "transition-all duration-300 ease-out",
            "active:scale-[0.97] active:shadow-md",
            isOpen && "ring-2 ring-primary/50 border-primary shadow-xl shadow-primary/20 bg-primary/5",
            "group pointer-events-auto"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-haspopup="true"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
        >
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            "bg-primary/10 group-hover:bg-primary/20",
            isOpen && "bg-primary/30 scale-110"
          )}>
            <Calendar className={cn(
              "h-5 w-5 transition-all duration-300",
              "text-primary group-hover:text-primary",
              isOpen && "scale-110 rotate-12"
            )} />
          </div>
          <div className="flex-1 text-sm min-w-0">
            <div className="flex flex-col">
              <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {isRTL ? "اختر التاريخ" : "Choose Date"}
              </span>
              <span className="text-xs text-muted-foreground/70">{isRTL ? "انقر للاختيار" : "Click to select"}</span>
            </div>
          </div>
          {hasDates && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all duration-200 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                clearDates();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isOpen && (
          <div 
            className={cn(
              "absolute top-full mt-3 p-5 bg-gradient-to-br from-card via-card to-card/95",
              "border-2 border-primary/20 rounded-2xl shadow-2xl min-w-[360px]",
              "animate-slide-down backdrop-blur-md date-picker-container",
              "ring-1 ring-primary/10",
              isRTL ? "right-0" : "left-0"
            )}
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{label}</h4>
                </div>
                {hasDates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearDates();
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    {isRTL ? "مسح" : "Clear"}
                  </Button>
                )}
              </div>
              
              <div className={cn("grid grid-cols-2 gap-4", isRTL && "grid-cols-2")}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {isRTL ? "من" : "From"}
                  </label>
                  <div className="relative group/input">
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
                      className={cn(
                        "w-full cursor-pointer transition-all duration-200",
                        "hover:border-primary/50 hover:bg-accent/30",
                        "focus:border-primary focus:ring-2 focus:ring-primary/20",
                        "font-medium"
                      )}
                      placeholder={isRTL ? "mm/dd/yyyy" : "mm/dd/yyyy"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {isRTL ? "إلى" : "To"}
                  </label>
                  <div className="relative group/input">
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
                      className={cn(
                        "w-full cursor-pointer transition-all duration-200",
                        "hover:border-primary/50 hover:bg-accent/30",
                        "focus:border-primary focus:ring-2 focus:ring-primary/20",
                        "font-medium"
                      )}
                      placeholder={isRTL ? "mm/dd/yyyy" : "mm/dd/yyyy"}
                    />
                  </div>
                </div>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex gap-2 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 text-xs font-medium transition-all duration-200",
                    "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                    "active:scale-95 hover:scale-105"
                  )}
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
                  className={cn(
                    "flex-1 text-xs font-medium transition-all duration-200",
                    "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                    "active:scale-95 hover:scale-105"
                  )}
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
                  className={cn(
                    "flex-1 text-xs font-medium transition-all duration-200",
                    "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                    "active:scale-95 hover:scale-105"
                  )}
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

