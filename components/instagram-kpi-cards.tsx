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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
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
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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

