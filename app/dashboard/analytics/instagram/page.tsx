"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth";
import { getTranslations, getLanguage } from "@/lib/i18n";

export default function InstagramAnalyticsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  if (!mounted) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">
              {isRTL ? "جاري التحميل..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Header Section */}
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {t.sidebar.instagram}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? "صفحة تحليل الإنستجرام - قيد التطوير" 
                : "Instagram Analytics Page - Under Development"}
            </p>
          </div>

          {/* Placeholder Content */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>
                {isRTL ? "قريباً" : "Coming Soon"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {isRTL 
                  ? "سيتم إضافة محتوى تحليل الإنستجرام هنا قريباً" 
                  : "Instagram analytics content will be added here soon"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
