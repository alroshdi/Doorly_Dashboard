"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIMetrics } from "@/lib/analytics";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { TrendingUp, FileText, Calendar, CheckCircle, Clock, XCircle, CreditCard, Tag, Eye, DollarSign, Home, Ruler } from "lucide-react";

interface KPICardsProps {
  metrics: KPIMetrics;
}

// Animated counter component
function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        current = Math.min(increment * step, value);
        setDisplayValue(Math.floor(current));

        if (step >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        }
      }, duration / steps);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, value, delay]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-DZ").format(Math.round(num));
  };

  return (
    <div ref={ref} className="counter-animate">
      {formatNumber(displayValue)}
    </div>
  );
}

export function KPICards({ metrics }: KPICardsProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat(isRTL ? "ar-DZ" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const getIconColor = (gradient: string) => {
    if (gradient.includes('blue')) return 'text-blue-500';
    if (gradient.includes('teal')) return 'text-teal-500';
    if (gradient.includes('green')) return 'text-green-500';
    if (gradient.includes('emerald')) return 'text-emerald-500';
    if (gradient.includes('amber')) return 'text-amber-500';
    if (gradient.includes('red')) return 'text-red-500';
    if (gradient.includes('purple')) return 'text-purple-500';
    if (gradient.includes('pink')) return 'text-pink-500';
    if (gradient.includes('cyan')) return 'text-cyan-500';
    if (gradient.includes('indigo')) return 'text-indigo-500';
    return 'text-primary';
  };

  const cards = [
    {
      title: t.kpi.totalRequests,
      value: metrics.totalRequests,
      icon: FileText,
      available: true,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: t.kpi.newToday,
      value: metrics.newToday,
      icon: Calendar,
      available: true,
      gradient: "from-teal-500 to-teal-600",
    },
    {
      title: t.kpi.verified,
      value: metrics.verified,
      icon: TrendingUp,
      available: true, // Always show value, even if 0
      gradient: "from-green-500 to-green-600",
    },
    {
      title: t.kpi.active,
      value: metrics.active,
      icon: CheckCircle,
      available: metrics.active > 0 || metrics.totalRequests > 0,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: t.kpi.completed,
      value: metrics.completed,
      icon: Clock,
      available: metrics.completed > 0 || metrics.totalRequests > 0,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      title: t.kpi.cancelled,
      value: metrics.cancelled,
      icon: XCircle,
      available: metrics.cancelled > 0 || metrics.totalRequests > 0,
      gradient: "from-red-500 to-red-600",
    },
    {
      title: t.kpi.paymentPendingVerify,
      value: metrics.paymentPendingVerify,
      icon: CreditCard,
      available: metrics.paymentPendingVerify > 0 || metrics.totalRequests > 0,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: t.kpi.totalOffers,
      value: metrics.totalOffers,
      icon: Tag,
      available: true, // Always show value, even if 0
      gradient: "from-pink-500 to-pink-600",
    },
    {
      title: t.kpi.totalViewsCount,
      value: metrics.totalViewsCount,
      icon: Eye,
      available: metrics.totalViewsCount > 0,
      gradient: "from-cyan-500 to-cyan-600",
    },
    {
      title: t.kpi.avgViews,
      value: metrics.avgViews,
      icon: Eye,
      available: metrics.avgViews > 0,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: t.kpi.avgPriceFrom,
      value: metrics.avgPriceFrom,
      icon: DollarSign,
      available: metrics.avgPriceFrom > 0,
      gradient: "from-yellow-500 to-yellow-600",
    },
    {
      title: t.kpi.avgPriceTo,
      value: metrics.avgPriceTo,
      icon: DollarSign,
      available: metrics.avgPriceTo > 0,
      gradient: "from-orange-500 to-orange-600",
    },
    {
      title: t.kpi.avgPriceRange,
      value: metrics.avgPriceRange,
      icon: DollarSign,
      available: metrics.avgPriceRange > 0,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      title: t.kpi.avgArea,
      value: metrics.avgArea,
      icon: Home,
      available: metrics.hasAreaColumn, // Show if column exists, even if value is 0
      gradient: "from-violet-500 to-violet-600",
      isDecimal: true,
    },
    {
      title: t.kpi.minArea,
      value: metrics.minArea,
      icon: Ruler,
      available: metrics.hasAreaColumn, // Show if column exists, even if value is 0
      gradient: "from-slate-500 to-slate-600",
    },
    {
      title: t.kpi.maxArea,
      value: metrics.maxArea,
      icon: Ruler,
      available: metrics.hasAreaColumn, // Show if column exists, even if value is 0
      gradient: "from-gray-500 to-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`
              ${!card.available ? "opacity-60" : ""}
              transition-all duration-500 ease-out
              hover:shadow-2xl hover:scale-[1.03]
              hover:border-primary/50
              cursor-default
              group
              bg-gradient-to-br from-card via-card/98 to-card/95
              backdrop-blur-sm
              border-2
              hover:border-primary/40
              hover-lift
              relative overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/0 before:to-primary/0
              hover:before:from-primary/5 hover:before:to-primary/10
              before:transition-all before:duration-500
            `}
            style={{ 
              animationDelay: `${index * 80}ms`,
              animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms both`
            }}
          >
            {/* Animated background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-semibold text-foreground/80 group-hover:text-primary transition-all duration-300 leading-tight">
                {card.title}
              </CardTitle>
              <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor(card.gradient)} group-hover:scale-125 transition-all duration-300`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className={`text-2xl sm:text-3xl md:text-4xl font-bold group-hover:scale-105 transition-all duration-300 mb-1 text-foreground group-hover:text-primary`}>
                {card.isDecimal || card.title.includes("Price") || card.title.includes("السعر") || card.title.includes("Area") || card.title.includes("المساحة") ? (
                  formatNumber(card.value, card.isDecimal ? 2 : (card.value < 1000 ? 2 : 0))
                ) : (
                  <AnimatedCounter value={card.value} delay={index * 100} />
                )}
              </div>
              {!card.available && (
                <p className="text-xs text-muted-foreground mt-2 animate-pulse-slow">{t.kpi.notAvailable}</p>
              )}
            </CardContent>
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Card>
        );
      })}
    </div>
  );
}

