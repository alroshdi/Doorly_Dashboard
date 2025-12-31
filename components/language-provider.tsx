"use client";

import { useEffect, useState } from "react";
import { getLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only update if different from default (ar/rtl)
    const currentLang = getLanguage();
    if (currentLang !== "ar") {
      document.documentElement.lang = currentLang;
      document.documentElement.dir = "ltr";
    }
  }, []);

  // Always render children, no conditional rendering to avoid hydration issues
  return <>{children}</>;
}


