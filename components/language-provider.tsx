"use client";

import { useEffect, useState } from "react";
import { getLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>("ar");

  useEffect(() => {
    setMounted(true);
    const currentLang = getLanguage();
    setLang(currentLang);
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}


