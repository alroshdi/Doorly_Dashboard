"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { getTranslations, getLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const router = useRouter();
  const lang = getLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">
          {isRTL ? "الصفحة غير موجودة" : "Page Not Found"}
        </h2>
        <p className="text-muted-foreground">
          {isRTL 
            ? "عذراً، الصفحة التي تبحث عنها غير موجودة." 
            : "Sorry, the page you are looking for does not exist."}
        </p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="mt-4"
        >
          <Home className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
          {isRTL ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
        </Button>
      </div>
    </div>
  );
}

