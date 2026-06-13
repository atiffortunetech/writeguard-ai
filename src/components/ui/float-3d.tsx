"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Float3DProps {
  children: ReactNode;
  className?: string;
  /** Tilt intensity in degrees */
  intensity?: number;
  disabled?: boolean;
  /** Gentle idle float animation */
  autoFloat?: boolean;
}

/** Hover + mouse parallax 3D card wrapper */
export function Float3D({
  children,
  className,
  intensity = 10,
  disabled = false,
  autoFloat = false,
}: Float3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canTilt, setCanTilt] = useState(false);

  useEffect(() => {
    setCanTilt(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !canTilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${y * -intensity}deg) rotateY(${x * intensity}deg) translateY(-6px) translateZ(14px)`;
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        "float-3d-card transition-[transform,box-shadow] duration-300 ease-out",
        autoFloat && "float-3d-idle",
        !disabled && canTilt && "hover:shadow-[0_28px_56px_rgba(124,58,237,0.22)]",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
