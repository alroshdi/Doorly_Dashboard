"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, Languages, BarChart3, Home, Users, Settings, ChevronDown, ChevronRight, Linkedin, Menu, X, Instagram, Share2 } from "lucide-react";
import { clearAuth } from "@/lib/auth";
import { getTranslations, getLanguage, setLanguage, type Language } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function SidebarLogo() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <div className="text-lg font-bold text-primary">Doorly</div>;
  }
  
  return (
    <Image
      src="/logo.png"
      alt="Doorly Logo"
      width={140}
      height={140}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [lang, setLangState] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);
  const [mediaAnalysisExpanded, setMediaAnalysisExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLangState(getLanguage());
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLanguage(newLang);
    setLangState(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-primary/10 transition-colors"
        style={{ [isRTL ? "right" : "left"]: "1rem" }}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "h-screen w-64 bg-gradient-to-b from-card via-card/98 to-card/95 border-border flex flex-col shadow-xl backdrop-blur-sm",
        isRTL ? "border-l" : "border-r",
        "animate-slide-in-left",
        // Mobile: drawer behavior
        "fixed lg:static z-50",
        "transform transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex justify-center items-center gap-2">
          <div className="flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-3 group">
            <div className="transition-transform duration-300 group-hover:scale-110">
              <SidebarLogo />
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-primary/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
        {/* Analytics - Main Section */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start font-semibold text-sm sm:text-base hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-[1.02] active:scale-95 group min-h-[44px]"
            onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
          >
            {analyticsExpanded ? (
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
            ) : (
              <ChevronRight className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
            )}
            <BarChart3 className={cn("h-5 w-5 transition-transform duration-300 group-hover:rotate-12", isRTL ? "mr-2" : "ml-2")} />
            {t.sidebar.analytics}
          </Button>
          
          {/* Sub-items */}
          {analyticsExpanded && (
            <div className={cn("space-y-1 animate-slide-down", isRTL ? "mr-6" : "ml-6")}>
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 min-h-[44px]",
                  pathname === "/dashboard" 
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => router.push("/dashboard")}
              >
                <Home className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
                {t.sidebar.overview}
              </Button>
              <Button
                variant={pathname === "/dashboard/customers" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 min-h-[44px]",
                  pathname === "/dashboard/customers" 
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => router.push("/dashboard/customers")}
              >
                <Users className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
                {t.sidebar.brokers}
              </Button>
            </div>
          )}
        </div>

        {/* Media Analysis - Main Section */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start font-semibold text-sm sm:text-base hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-[1.02] active:scale-95 group min-h-[44px]"
            onClick={() => setMediaAnalysisExpanded(!mediaAnalysisExpanded)}
          >
            {mediaAnalysisExpanded ? (
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
            ) : (
              <ChevronRight className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
            )}
            <Share2 className={cn("h-5 w-5 transition-transform duration-300 group-hover:rotate-12", isRTL ? "mr-2" : "ml-2")} />
            {t.sidebar.mediaAnalysis}
          </Button>
          
          {/* Sub-items */}
          {mediaAnalysisExpanded && (
            <div className={cn("space-y-1 animate-slide-down", isRTL ? "mr-6" : "ml-6")}>
              <Button
                variant={pathname === "/dashboard/analytics/instagram" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 min-h-[44px]",
                  pathname === "/dashboard/analytics/instagram" 
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => router.push("/dashboard/analytics/instagram")}
              >
                <Instagram className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
                {t.sidebar.instagram}
              </Button>
              <Button
                variant={pathname === "/dashboard/linkedin" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 min-h-[44px]",
                  pathname === "/dashboard/linkedin" 
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => router.push("/dashboard/linkedin")}
              >
                <Linkedin className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
                {t.sidebar.linkedin}
              </Button>
            </div>
          )}
        </div>

        {/* Settings */}
        <Button
          variant={pathname === "/dashboard/settings" ? "default" : "ghost"}
          className={cn(
            "w-full justify-start transition-all duration-300 hover:scale-[1.02] active:scale-95 group min-h-[44px]",
            pathname === "/dashboard/settings" 
              ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
              : "hover:bg-primary/10 hover:text-primary"
          )}
          onClick={() => router.push("/dashboard/settings")}
        >
          <Settings className={cn("h-4 w-4 transition-transform duration-300 group-hover:rotate-90", isRTL ? "mr-2" : "ml-2")} />
          {t.sidebar.settings}
        </Button>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 sm:p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm space-y-3">
        {/* Language and Theme Toggle Icons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 sm:h-9 sm:w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
            onClick={toggleLanguage}
            title={lang === "ar" ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4 transition-transform duration-300" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 sm:h-9 sm:w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
            onClick={toggleTheme}
            title={theme === "dark" ? (isRTL ? "فاتح" : "Light") : (isRTL ? "داكن" : "Dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300" />
            )}
          </Button>
        </div>

        {/* User Info */}
        <div className="px-3 py-2 text-xs sm:text-sm text-muted-foreground text-center bg-muted/50 rounded-md">
          {t.sidebar.admin}
        </div>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full justify-start hover:bg-destructive/90 transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-95 hover:shadow-md group min-h-[44px]"
          onClick={handleLogout}
        >
          <LogOut className={cn("h-4 w-4 transition-transform duration-300 group-hover:translate-x-1", isRTL ? "mr-2" : "ml-2")} />
          {t.sidebar.logout}
        </Button>
      </div>
    </div>
    </>
  );
}

