"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isAuthenticated, isAdmin, getCurrentUser } from "@/lib/auth";
import { getTranslations, getLanguage, setLanguage, type Language } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Moon, Sun, Languages, Save, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserManagement } from "@/components/user-management";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [lang, setLangState] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    setLangState(getLanguage());
  }, [router]);

  const handleLanguageChange = (newLang: Language) => {
    setLangState(newLang);
    setLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    router.refresh();
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    // Settings are already applied, no need for additional save
  };

  if (!mounted) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const t = getTranslations(lang);
  const isRTL = lang === "ar";
  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto lg:ml-0">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 lg:pt-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.sidebar.settings}</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              {isRTL ? "إدارة إعدادات التطبيق" : "Manage application settings"}
            </p>
          </div>

          {/* User Management - Only for Admins */}
          {userIsAdmin && (
            <UserManagement isRTL={isRTL} />
          )}

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {isRTL ? "إعدادات اللغة" : "Language Settings"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "اختر لغة الواجهة" : "Choose your preferred language"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isRTL ? "اللغة" : "Language"}</Label>
                <Select
                  value={lang}
                  onChange={(e) => {
                    const newLang = e.target.value as Language;
                    handleLanguageChange(newLang);
                  }}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                {isRTL ? "إعدادات المظهر" : "Appearance Settings"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "اختر مظهر التطبيق" : "Choose your preferred theme"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isRTL ? "المظهر" : "Theme"}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => handleThemeChange("light")}
                    className="flex-1 min-h-[44px]"
                  >
                    <Sun className="h-4 w-4 ml-2" />
                    {isRTL ? "فاتح" : "Light"}
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => handleThemeChange("dark")}
                    className="flex-1 min-h-[44px]"
                  >
                    <Moon className="h-4 w-4 ml-2" />
                    {isRTL ? "داكن" : "Dark"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px] min-h-[44px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  {isRTL ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  {isRTL ? "حفظ" : "Save"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

