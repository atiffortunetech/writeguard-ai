"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function DashboardHeader({ title, description }: { title: string; description?: string }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="relative flex items-center justify-between border-b border-violet-100/60 glass-panel px-8 py-5">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500 animate-pulse-glow" />
          <h1 className="font-display text-2xl font-bold tracking-tight gradient-text">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
        {isAdmin && (
          <Badge className="border-violet-200 bg-violet-50 text-violet-700 animate-pulse-glow">
            ADMIN · Unlimited
          </Badge>
        )}
        <Badge variant="secondary" className="border-violet-100 bg-white/80">
          {session?.user?.email}
        </Badge>
      </div>
    </header>
  );
}
