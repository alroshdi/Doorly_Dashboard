"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIMetrics } from "@/lib/analytics";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { TrendingUp, FileText, Calendar, CheckCircle, Clock, XCircle, CreditCard, Tag, Eye, DollarSign, Maximize2, Minimize2, BarChart3, ArrowDown, ArrowUp } from "lucide-react";

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

  type CardItem = {
    title: string;
    value: number;
    icon: any;
    available: boolean;
    gradient: string;
    isArea?: boolean;
    isPriceRange?: boolean;
    useLogo?: boolean;
  };

  const cards: CardItem[] = [
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
    // Price range cards - will be rendered separately side by side
    {
      title: t.kpi.avgPriceFrom,
      value: metrics.avgPriceFrom,
      icon: ArrowDown,
      available: metrics.avgPriceFrom > 0,
      gradient: "from-orange-500 to-orange-600",
      isPriceRange: true,
      useLogo: true,
    },
    {
      title: t.kpi.avgPriceTo,
      value: metrics.avgPriceTo,
      icon: ArrowUp,
      available: metrics.avgPriceTo > 0,
      gradient: "from-yellow-500 to-yellow-600",
      isPriceRange: true,
      useLogo: true,
    },
  ];

  // Separate price range cards from regular cards
  const priceRangeCards = cards.filter(card => card.isPriceRange === true);
  const regularCards = cards.filter(card => !card.isPriceRange);

  // Render a single card
  const renderCard = (card: CardItem, index: number) => {
    const Icon = card.icon;
    return (
      <Card 
        key={index} 
        className={`
          ${!card.available ? "opacity-60" : ""}
          border-2 border-border/50
          bg-gradient-to-br from-card to-card/95
          hover:border-primary/50
          hover:shadow-lg
          hover:shadow-primary/5
          transition-all duration-300
          h-full
          group
          overflow-hidden
          relative
        `}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            {card.title}
          </CardTitle>
          <div className={`
            p-2.5 rounded-xl
            bg-gradient-to-br ${card.gradient}
            shadow-md
            group-hover:shadow-lg
            group-hover:scale-110
            transition-all duration-300
            relative
          `}>
            {card.useLogo ? (
              <div className="w-[18px] h-[18px] flex items-center justify-center">
                <Image
                  src="/Bold.png"
                  alt="Logo"
                  width={18}
                  height={18}
                  className="object-contain w-full h-full"
                />
              </div>
            ) : (
              <Icon className="h-4 w-4 text-white" />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 relative z-10">
          <div className="text-3xl font-bold flex items-baseline gap-2">
            {card.available ? (
              <>
                {card.isPriceRange ? (
                  <>
                    <AnimatedCounter value={card.value} delay={index * 50} />
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Image
                        src="/Bold.png"
                        alt="Currency"
                        width={24}
                        height={24}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </>
                ) : (
                  <AnimatedCounter value={card.value} delay={index * 50} />
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">{t.kpi.notAvailable}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mb-3 space-y-2">
      {/* Regular cards - standard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {regularCards.map((card, index) => renderCard(card, index))}
      </div>
      
      {/* Price range cards - full width, side by side */}
      {priceRangeCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {priceRangeCards.map((card, index) => renderCard(card, index))}
        </div>
      )}
    </div>
  );
}

