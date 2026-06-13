"use client";

import { cn } from "@/lib/utils";

type SceneVariant = "marketing" | "dashboard" | "auth" | "admin";

interface Scene3DLayerProps {
  variant?: SceneVariant;
  className?: string;
}

/** Ambient floating orbs, rings & particles — used across all site shells */
export function Scene3DLayer({ variant = "dashboard", className }: Scene3DLayerProps) {
  return (
    <div
      className={cn("scene-3d-layer pointer-events-none fixed inset-0 -z-[1] overflow-hidden", className)}
      aria-hidden
    >
      <div className={cn("scene-3d-orb scene-3d-orb-1", `scene-3d-orb-${variant}`)} />
      <div className={cn("scene-3d-orb scene-3d-orb-2", `scene-3d-orb-${variant}`)} />
      <div className={cn("scene-3d-orb scene-3d-orb-3 hidden sm:block", `scene-3d-orb-${variant}`)} />
      <div className="scene-3d-ring scene-3d-ring-a hidden md:block" />
      <div className="scene-3d-ring scene-3d-ring-b hidden lg:block" />
      <div className="scene-3d-cube scene-3d-cube-a hidden lg:block" />
      <div className="scene-3d-cube scene-3d-cube-b hidden xl:block" />
      <div className="scene-3d-particles" />
      {variant === "marketing" && (
        <>
          <div className="scene-3d-beam scene-3d-beam-a" />
          <div className="scene-3d-beam scene-3d-beam-b" />
        </>
      )}
    </div>
  );
}
