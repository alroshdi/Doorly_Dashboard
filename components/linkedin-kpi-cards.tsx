"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkedInKPIs } from "@/lib/linkedin-analytics";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { 
  FileText, Eye, Heart, MessageCircle, Share2, MousePointerClick,
  Users, TrendingUp, Globe, Building2, BarChart3
} from "lucide-react";

interface LinkedInKPICardsProps {
  kpis: LinkedInKPIs;
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return new Intl.NumberFormat("en-US").format(Math.round(num));
  };

  return (
    <div ref={ref} className="counter-animate">
      {formatNumber(displayValue)}
    </div>
  );
}

export function LinkedInKPICards({ kpis }: LinkedInKPICardsProps) {
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

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return Math.round(seconds) + "s";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const cards = [
    {
      title: t.linkedin.kpi.totalPosts,
      value: Math.max(0, kpis.totalPosts),
      icon: FileText,
      gradient: "from-blue-500 to-blue-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalImpressions,
      value: Math.max(0, kpis.totalImpressions),
      icon: Eye,
      gradient: "from-purple-500 to-purple-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalEngagements,
      value: Math.max(0, kpis.totalEngagements),
      icon: Heart,
      gradient: "from-pink-500 to-pink-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.avgEngagementRate,
      value: Math.max(0, kpis.avgEngagementRate),
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      available: true,
      isPercentage: true,
    },
    {
      title: t.linkedin.kpi.totalLikes,
      value: Math.max(0, kpis.totalLikes),
      icon: Heart,
      gradient: "from-red-500 to-red-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalComments,
      value: Math.max(0, kpis.totalComments),
      icon: MessageCircle,
      gradient: "from-cyan-500 to-cyan-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalShares,
      value: Math.max(0, kpis.totalShares),
      icon: Share2,
      gradient: "from-indigo-500 to-indigo-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalClicks,
      value: Math.max(0, kpis.totalClicks),
      icon: MousePointerClick,
      gradient: "from-orange-500 to-orange-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalFollowers,
      value: Math.max(0, kpis.totalFollowers),
      icon: Users,
      gradient: "from-teal-500 to-teal-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.newFollowers,
      value: Math.max(0, kpis.newFollowers),
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.totalVisitors,
      value: Math.max(0, kpis.totalVisitors),
      icon: Globe,
      gradient: "from-violet-500 to-violet-600",
      available: true,
    },
    {
      title: t.linkedin.kpi.uniqueVisitors,
      value: Math.max(0, kpis.uniqueVisitors),
      icon: Users,
      gradient: "from-rose-500 to-rose-600",
      available: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className="border border-border bg-card hover:border-primary/50 transition-colors"
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
              <div className="text-2xl font-bold">
                {card.isPercentage ? (
                  formatPercentage(card.value)
                ) : (
                  <AnimatedCounter value={card.value} delay={index * 50} />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


