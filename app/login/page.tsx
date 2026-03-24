"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { setAuth, isAuthenticated, UserRole } from "@/lib/auth";
import { getTranslations, getLanguage, setLanguage, type Language } from "@/lib/i18n";

function LogoImage() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <div className="text-2xl font-bold text-primary">Doorly</div>;
  }
  
  return (
    <Image
      src="/logo.png"
      alt="Doorly Logo"
      width={160}
      height={160}
      className="object-contain"
      priority
      onError={() => setImgError(true)}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLangState] = useState<Language>("ar");

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
    setLangState(getLanguage());
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email === "admin@admin.com" && password === "admin123") {
      setAuth(email, "admin");
      router.push("/dashboard");
    } else {
      setError(getTranslations(lang).login.error);
    }
  };

  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLanguage(newLang);
    setLangState(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const t = getTranslations(lang);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-primary/[0.07] via-background to-secondary/[0.07] px-4 py-10">
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-40 h-40 flex items-center justify-center">
              <LogoImage />
            </div>
          </div>
          <CardTitle className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            {t.login.title}
          </CardTitle>
          <CardDescription className="text-pretty text-sm leading-relaxed md:text-base">
            {t.login.subtitle}
          </CardDescription>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="text-xs"
            >
              {lang === "ar" ? "EN" : "AR"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t.login.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t.login.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t.login.password}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.login.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground outline-none ring-offset-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={showPassword ? (lang === "ar" ? "إخفاء كلمة المرور" : "Hide password") : lang === "ar" ? "إظهار كلمة المرور" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <Button type="submit" className="w-full">
              {t.login.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

