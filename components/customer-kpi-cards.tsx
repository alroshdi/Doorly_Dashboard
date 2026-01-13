"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerKPIs } from "@/lib/analytics";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { Users, UserCheck, TrendingUp, BarChart3, Repeat } from "lucide-react";

interface CustomerKPICardsProps {
  metrics: CustomerKPIs;
}

export function CustomerKPICards({ metrics }: CustomerKPICardsProps) {
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(isRTL ? "ar-DZ" : "en-US").format(Math.round(num));
  };

  const cards = [
    {
      title: isRTL ? "إجمالي العملاء" : "Total Customers",
      value: formatNumber(metrics.totalCustomers),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: isRTL ? "العملاء النشطون" : "Active Customers",
      value: formatNumber(metrics.activeCustomers),
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: isRTL ? "أعلى عدد طلبات" : "Top Customer Requests",
      value: formatNumber(metrics.topCustomerRequests),
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: isRTL ? "متوسط الطلبات/عميل" : "Avg Requests/Customer",
      value: formatNumber(metrics.avgRequestsPerCustomer),
      icon: BarChart3,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: isRTL ? "عملاء بطلبات متعددة" : "Customers with Multiple Requests",
      value: formatNumber(metrics.customersWithMultipleRequests),
      icon: Repeat,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
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
              transition-all duration-300 ease-in-out
              hover:shadow-xl hover:scale-[1.02]
              hover:border-primary/50
              cursor-default
              group
              bg-gradient-to-br from-card to-card/95
              backdrop-blur-sm
              border-2
              hover:border-primary/30
            `}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors duration-300">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor} group-hover:scale-110 transition-all duration-300`}>
                <Icon className={`h-4 w-4 ${card.color} group-hover:scale-110 transition-all duration-300`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold group-hover:text-primary transition-colors duration-300 mb-1">
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}




