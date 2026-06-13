"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Float3DProps {
  children: ReactNode;
  className?: string;
  /** Tilt intensity in degrees */
  intensity?: number;
  disabled?: boolean;
}

/** Hover + mouse parallax 3D card wrapper */
export function Float3D({
  children,
  className,
  intensity = 10,
  disabled = false,
}: Float3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateX(${y * -intensity}deg) rotateY(${x * intensity}deg) translateY(-4px) translateZ(8px)`;
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        "float-3d-card transition-[transform,box-shadow] duration-300 ease-out",
        !disabled && "hover:shadow-[0_24px_48px_rgba(124,58,237,0.18)]",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
