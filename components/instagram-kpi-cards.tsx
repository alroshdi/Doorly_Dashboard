"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstagramKPIs } from "@/lib/instagram-analytics";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { 
  FileText, Heart, MessageCircle, Bookmark, Eye, TrendingUp, Clock
} from "lucide-react";

interface InstagramKPICardsProps {
  kpis: InstagramKPIs;
}

// Animated counter component
function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const timer = setTimeout(() => {
      hasAnimated.current = true;
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return <>{Math.round(displayValue)}</>;
}

export function InstagramKPICards({ kpis }: InstagramKPICardsProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return new Intl.NumberFormat(isRTL ? "ar-DZ" : "en-US").format(Math.round(num));
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(2) + "%";
  };

  const cards = [
    {
      title: t.instagram.kpi.bestPostingTime,
      value: kpis.bestPostingTime,
      icon: Clock,
      gradient: "from-purple-500 to-purple-600",
      available: true,
      isText: true,
    },
    {
      title: t.instagram.kpi.avgEngagementPerPost,
      value: Math.max(0, kpis.avgEngagementPerPost),
      icon: TrendingUp,
      gradient: "from-blue-500 to-blue-600",
      available: true,
    },
    {
      title: t.instagram.kpi.totalReach,
      value: Math.max(0, kpis.totalReach),
      icon: Eye,
      gradient: "from-green-500 to-green-600",
      available: true,
    },
    {
      title: t.instagram.kpi.avgEngagementRate,
      value: Math.max(0, kpis.avgEngagementRate),
      icon: TrendingUp,
      gradient: "from-pink-500 to-pink-600",
      available: true,
      isPercentage: true,
    },
    {
      title: t.instagram.kpi.totalEngagement,
      value: Math.max(0, kpis.totalEngagement),
      icon: Heart,
      gradient: "from-red-500 to-red-600",
      available: true,
    },
    {
      title: t.instagram.kpi.totalPosts,
      value: Math.max(0, kpis.totalPosts),
      icon: FileText,
      gradient: "from-indigo-500 to-indigo-600",
      available: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mb-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`
              ${!card.available ? "opacity-60" : ""}
              border border-border
              bg-card
              hover:border-primary/50
              transition-colors
            `}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold">
                {card.title}
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold">
                {card.isText ? (
                  <span className="text-foreground">{card.value}</span>
                ) : card.isPercentage ? (
                  <span className="text-primary">
                    <AnimatedCounter value={card.value as number} delay={index * 100} />
                    <span className="text-lg ml-1">%</span>
                  </span>
                ) : card.isText ? (
                  <span className="text-foreground text-base">{card.value}</span>
                ) : (
                  <span className="text-foreground">
                    <AnimatedCounter value={card.value as number} delay={index * 100} />
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

