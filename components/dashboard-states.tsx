"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLoaderProps {
  label: string;
  className?: string;
}

export function DashboardLoader({ label, className }: DashboardLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[min(60vh,36rem)] flex-col items-center justify-center gap-4 py-16 text-center",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 shrink-0 animate-spin text-primary" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
