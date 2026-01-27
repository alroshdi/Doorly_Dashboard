"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, Languages, BarChart3, Home, Users, Settings, ChevronDown, ChevronRight, Linkedin, Instagram, Share2, Snowflake, UserCircle, Shield } from "lucide-react";
import { clearAuth, getUserRole, User } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-management";
import { getTranslations, getLanguage, setLanguage, type Language } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { toggleSnow } from "@/components/snow-effect";

function SidebarLogo() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <div className="text-lg font-bold text-primary">Doorly</div>;
  }
  
  return (
    <Image
      src="/logo.png"
      alt="Doorly Logo"
      width={112}
      height={112}
      className="object-contain"
      priority
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
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    setLangState(getLanguage());
    // Check snow preference
    if (typeof window !== "undefined") {
      const snowPreference = localStorage.getItem("doorly_snow_enabled");
      setSnowEnabled(snowPreference === "true");
      // Get current user info
      setCurrentUser(getCurrentUser());
    }
  }, []);

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

  const toggleSnowEffect = () => {
    const newState = !snowEnabled;
    setSnowEnabled(newState);
    toggleSnow(newState);
  };

  if (!mounted) return null;

  const t = getTranslations(lang);
  const isRTL = lang === "ar";

  return (
    <div className={`h-screen w-64 bg-gradient-to-b from-card via-card/98 to-card/95 border-border flex flex-col shadow-xl backdrop-blur-sm ${isRTL ? "border-l" : "border-r"} animate-slide-in-left`}>
      {/* Logo */}
      <div className="p-6 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex justify-center">
          <div className="w-28 h-28 flex items-center justify-center p-3 transition-all duration-300 hover:scale-110 hover:rotate-3 group">
            <div className="transition-transform duration-300 group-hover:scale-110">
              <SidebarLogo />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Analytics - Main Section */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start font-semibold text-base hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
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
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95",
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
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95",
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

        {/* Media Analysis - New Section */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start font-semibold text-base hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
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

          {/* Sub-items for Media Analysis */}
          {mediaAnalysisExpanded && (
            <div className={cn("space-y-1 animate-slide-down", isRTL ? "mr-6" : "ml-6")}>
              <Button
                variant={pathname === "/dashboard/instagram" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95",
                  pathname === "/dashboard/instagram" 
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg" 
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => router.push("/dashboard/instagram")}
              >
                <Instagram className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isRTL ? "mr-2" : "ml-2")} />
                {t.sidebar.instagram}
              </Button>
              <Button
                variant={pathname === "/dashboard/linkedin" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95",
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
            "w-full justify-start transition-all duration-300 hover:scale-[1.02] active:scale-95 group",
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
      <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm space-y-3">
        {/* Language, Theme, and Snow Toggle Icons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
            onClick={toggleLanguage}
            title={lang === "ar" ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4 transition-transform duration-300" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
            onClick={toggleTheme}
            title={theme === "dark" ? (isRTL ? "فاتح" : "Light") : (isRTL ? "داكن" : "Dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300" />
            )}
          </Button>
          <Button
            variant={snowEnabled ? "default" : "outline"}
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
            onClick={toggleSnowEffect}
            title={isRTL ? (snowEnabled ? "إيقاف الثلج" : "تفعيل الثلج") : (snowEnabled ? "Disable Snow" : "Enable Snow")}
          >
            <Snowflake className="h-4 w-4 transition-transform duration-300" />
          </Button>
        </div>

        {/* User Info */}
        {mounted && (
          <div className="px-4 py-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {currentUser?.avatarUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                    <Image
                      src={currentUser.avatarUrl}
                      alt={currentUser.name || "User"}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                    <UserCircle className="h-7 w-7 text-primary" />
                  </div>
                )}
                {/* Online status indicator */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {currentUser?.name || t.sidebar.admin}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="capitalize">
                    {mounted && typeof window !== "undefined" 
                      ? (getUserRole() === "admin" ? t.sidebar.admin : getUserRole())
                      : t.sidebar.admin
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full justify-start hover:bg-destructive/90 transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-95 hover:shadow-md group"
          onClick={handleLogout}
        >
          <LogOut className={cn("h-4 w-4 transition-transform duration-300 group-hover:translate-x-1", isRTL ? "mr-2" : "ml-2")} />
          {t.sidebar.logout}
        </Button>
      </div>
    </div>
  );
}

