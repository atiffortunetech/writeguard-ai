"use client";

import { cn } from "@/lib/utils";

interface MeshBackgroundProps {
  variant?: "light" | "dark" | "dashboard";
  className?: string;
}

export function MeshBackground({ variant = "light", className }: MeshBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        variant === "dark" && "opacity-40",
        className
      )}
    >
      <div
        className={cn(
          "absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full blur-[120px] animate-mesh-drift",
          variant === "dashboard"
            ? "bg-violet-400/20"
            : "bg-violet-500/30"
        )}
      />
      <div
        className={cn(
          "absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full blur-[100px] animate-mesh-drift-reverse",
          variant === "dashboard" ? "bg-cyan-400/15" : "bg-cyan-400/25"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full blur-[90px] animate-float",
          variant === "dashboard" ? "bg-fuchsia-400/10" : "bg-fuchsia-500/20"
        )}
      />
      {variant === "light" && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-white/80 to-violet-50/50" />
      )}
      {variant === "dashboard" && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-violet-50/30 to-cyan-50/20" />
      )}
      {variant === "dark" && (
        <div className="absolute inset-0 bg-slate-950/90" />
      )}
    </div>
  );
}
