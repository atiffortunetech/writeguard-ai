"use client";

import { cn } from "@/lib/utils";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimateInProps) {
  const directionClass = {
    up: "animate-fade-up",
    down: "animate-fade-down",
    left: "animate-fade-left",
    right: "animate-fade-right",
    none: "animate-fade-in",
  }[direction];

  return (
    <div
      className={cn(directionClass, className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}
