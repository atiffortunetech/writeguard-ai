"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";
import { useDashboardShell } from "@/components/dashboard/dashboard-shell-context";

export function DashboardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const shell = useDashboardShell();

  return (
    <header className="relative shrink-0 border-b border-violet-100/60 glass-panel px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {shell && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-0.5 shrink-0 border-violet-200/80 bg-white/80 lg:hidden"
              onClick={() => shell.openMenu()}
              aria-label="Open navigation menu"
              aria-expanded={shell.menuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0 animate-fade-up">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-500 animate-pulse-glow" />
              <h1 className="font-display truncate text-xl font-bold tracking-tight gradient-text sm:text-2xl">
                {title}
              </h1>
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 sm:line-clamp-none sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 sm:justify-end animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {isAdmin && (
            <Badge className="border-violet-200 bg-violet-50 text-violet-700 animate-pulse-glow text-[10px] sm:text-xs">
              ADMIN · Unlimited
            </Badge>
          )}
          {session?.user?.email && (
            <Badge
              variant="secondary"
              className="max-w-full truncate border-violet-100 bg-white/80 text-[10px] sm:max-w-[240px] sm:text-xs"
              title={session.user.email}
            >
              {session.user.email}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
