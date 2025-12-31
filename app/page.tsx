"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { getLanguage } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Small delay to ensure router is ready
    const timer = setTimeout(() => {
      // Only redirect if we're on the root path
      if (pathname === "/" || pathname === "") {
        if (isAuthenticated()) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      }
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [router, pathname]);

  // Show loading state while checking authentication
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {getLanguage() === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}


