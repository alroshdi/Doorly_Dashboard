"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
      title: t.kpi.avgPriceFrom,
      value: metrics.avgPriceFrom,
      icon: DollarSign,
      available: metrics.avgPriceFrom > 0,
      gradient: "from-yellow-500 to-yellow-600",
      isDecimal: true,
      unitImage: "/Bold.png",
    },
    {
      title: t.kpi.avgPriceTo,
      value: metrics.avgPriceTo,
      icon: DollarSign,
      available: metrics.avgPriceTo > 0,
      gradient: "from-orange-500 to-orange-600",
      isDecimal: true,
      unitImage: "/Bold.png",
    },
    {
      title: t.kpi.avgPriceRange,
      value: metrics.avgPriceRange,
      icon: DollarSign,
      available: metrics.avgPriceRange > 0,
      gradient: "from-amber-500 to-amber-600",
      isDecimal: true,
      unitImage: "/Bold.png",
    },
    {
      title: t.kpi.avgArea,
      value: metrics.avgArea,
      icon: Home,
      available: metrics.hasAreaColumn, // Show if column exists, even if value is 0
      gradient: "from-violet-500 to-violet-600",
      isDecimal: true,
      unit: "m²",
    },
    {
      title: t.kpi.minArea,
      value: metrics.minArea,
      icon: Ruler,
      available: metrics.hasAreaColumn, // Show if column exists, even if value is 0
      gradient: "from-slate-500 to-slate-600",
      unit: "m²",
    },
    {
      title: t.kpi.maxArea,
      value: metrics.maxArea,
      icon: Ruler,
      available: metrics.hasAreaColumn, // Show if column exists, even if value is 0
      gradient: "from-gray-500 to-gray-600",
      unit: "m²",
    },
  ];

  // Compact grid: Reduced gaps for better information density
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        // Compact card: Reduced decorative effects, focus on data
        return (
          <Card 
            key={index} 
            className={`
              ${!card.available ? "opacity-60" : ""}
              transition-all duration-300
              hover:shadow-md
              cursor-default
              group
              bg-card
              border
              hover:border-primary/30
              relative overflow-hidden
            `}
            style={{ 
              animationDelay: `${index * 80}ms`,
              animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms both`
            }}
          >
            {/* Compact card header: Reduced padding for density */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-3 sm:px-4 pt-3">
              <CardTitle className="text-xs sm:text-sm font-semibold text-foreground/80 group-hover:text-primary transition-all duration-300 leading-tight">
                {card.title}
              </CardTitle>
              <div className="transition-all duration-300">
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${getIconColor(card.gradient)} transition-all duration-300`} />
              </div>
            </CardHeader>
            {/* Compact card content: Reduced padding and font sizes */}
            <CardContent className="relative z-10 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 mb-0.5 text-foreground group-hover:text-primary flex items-baseline gap-1`}>
                {card.isDecimal || card.title.includes("Price") || card.title.includes("السعر") || card.title.includes("Area") || card.title.includes("المساحة") ? (
                  <>
                    {formatNumber(card.value, card.isDecimal ? 2 : (card.value < 1000 ? 2 : 0))}
                    {card.unitImage ? (
                      <Image 
                        src={card.unitImage.startsWith('/') ? card.unitImage : `/${card.unitImage}`} 
                        alt="unit" 
                        width={24} 
                        height={24} 
                        className="inline-block ml-1"
                        style={{ width: 'auto', height: '1em' }}
                      />
                    ) : card.unit && (
                      <span className="text-sm sm:text-base md:text-lg text-muted-foreground font-normal">
                        {card.unit}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <AnimatedCounter value={card.value} delay={index * 100} />
                    {card.unitImage ? (
                      <Image 
                        src={card.unitImage.startsWith('/') ? card.unitImage : `/${card.unitImage}`} 
                        alt="unit" 
                        width={24} 
                        height={24} 
                        className="inline-block ml-1"
                        style={{ width: 'auto', height: '1em' }}
                      />
                    ) : card.unit && (
                      <span className="text-sm sm:text-base md:text-lg text-muted-foreground font-normal">
                        {card.unit}
                      </span>
                    )}
                  </>
                )}
              </div>
              {!card.available && (
                <p className="text-xs text-muted-foreground mt-1">{t.kpi.notAvailable}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

