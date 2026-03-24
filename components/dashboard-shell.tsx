"use client";

import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  /** Extra classes on the inner content wrapper */
  className?: string;
}

/**
 * App-shell layout: fixed-height viewport, sidebar, scrollable main with max-width and consistent padding.
 */
export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content / تخطي إلى المحتوى
      </a>
      <Sidebar />
      <main
        id="dashboard-main"
        tabIndex={-1}
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-background via-background to-muted/25 outline-none"
      >
        <div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
          <div
            className={cn(
              "mx-auto w-full max-w-dashboard px-4 pb-8 pt-5 md:px-6 md:pb-10 md:pt-6 lg:px-8",
              className
            )}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
