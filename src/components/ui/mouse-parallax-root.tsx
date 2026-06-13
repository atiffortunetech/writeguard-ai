"use client";

import { useEffect, type ReactNode } from "react";

/** Subtle site-wide mouse parallax via CSS custom properties */
export function MouseParallaxRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      document.documentElement.style.setProperty("--mx", String(x));
      document.documentElement.style.setProperty("--my", String(y));
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <>{children}</>;
}
