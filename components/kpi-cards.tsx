"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIMetrics } from "@/lib/analytics";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { TrendingUp, FileText, Calendar, CheckCircle, Clock, XCircle, CreditCard, Tag, Eye, DollarSign } from "lucide-react";

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(isRTL ? "ar-DZ" : "en-US").format(Math.round(num));
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
      available: metrics.verified > 0 || metrics.totalRequests > 0,
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
      title: t.kpi.pending,
      value: metrics.pending,
      icon: Clock,
      available: metrics.pending > 0 || metrics.totalRequests > 0,
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
      available: metrics.totalOffers > 0,
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
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
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
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold group-hover:text-primary transition-all duration-300 group-hover:scale-105">
                {card.title}
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                <Icon className="h-4 w-4 text-primary group-hover:scale-125 transition-all duration-300" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold group-hover:text-primary transition-all duration-300 mb-1 group-hover:scale-105 inline-block">
                <AnimatedCounter value={card.value} delay={index * 100} />
              </div>
              {!card.available && (
                <p className="text-xs text-muted-foreground mt-1 animate-pulse-slow">{t.kpi.notAvailable}</p>
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

