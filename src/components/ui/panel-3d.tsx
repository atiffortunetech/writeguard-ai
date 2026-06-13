"use client";

import type { ReactNode } from "react";
import { AnimateIn } from "@/components/ui/animate-in";
import { Float3D } from "@/components/ui/float-3d";
import { cn } from "@/lib/utils";

interface Panel3DProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  intensity?: number;
  /** Disable mouse tilt on touch devices automatically */
  tilt?: boolean;
}

/** Card / panel with entrance animation + hover 3D tilt */
export function Panel3D({
  children,
  className,
  delay = 0,
  direction = "up",
  intensity = 12,
  tilt = true,
}: Panel3DProps) {
  const inner = (
    <div className={cn("panel-3d-inner", className)}>{children}</div>
  );

  return (
    <AnimateIn delay={delay} direction={direction}>
      {tilt ? (
        <Float3D intensity={intensity} className="panel-3d-wrap">
          {inner}
        </Float3D>
      ) : (
        inner
      )}
    </AnimateIn>
  );
}
