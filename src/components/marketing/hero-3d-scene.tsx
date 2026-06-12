"use client";

import { useEffect, useRef } from "react";
import { Brain, Shield, Sparkles, Wand2, FileText, Languages } from "lucide-react";

const ORBIT_ITEMS = [
  { icon: Brain, label: "Intelligence", color: "from-violet-500 to-purple-600" },
  { icon: Wand2, label: "Humanizer", color: "from-fuchsia-500 to-pink-500" },
  { icon: Shield, label: "Plagiarism", color: "from-cyan-400 to-blue-500" },
  { icon: Sparkles, label: "Smart Rewrite", color: "from-amber-400 to-orange-500" },
  { icon: FileText, label: "SOP & Reports", color: "from-emerald-400 to-teal-500" },
  { icon: Languages, label: "Translator", color: "from-indigo-400 to-violet-500" },
];

export function HeroScene3D() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      scene.style.setProperty("--rx", `${y * -12}deg`);
      scene.style.setProperty("--ry", `${x * 14}deg`);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="hero-scene-wrapper" aria-hidden>
      <div ref={sceneRef} className="hero-scene-3d">
        <div className="hero-scene-core">
          <div className="hero-scene-orb" />
          <div className="hero-scene-orb-glow" />
          <div className="hero-scene-ring hero-scene-ring-1" />
          <div className="hero-scene-ring hero-scene-ring-2" />
        </div>

        <div className="hero-orbit-track">
          {ORBIT_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const angle = (360 / ORBIT_ITEMS.length) * i;
            return (
              <div
                key={item.label}
                className="hero-orbit-item"
                style={{ "--orbit-angle": `${angle}deg` } as React.CSSProperties}
              >
                <div className={`hero-orbit-card bg-gradient-to-br ${item.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                  <span className="text-[10px] font-semibold text-white/90">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hero-float-card hero-float-card-a">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Grammar</p>
          <p className="font-display text-2xl font-bold text-white">98</p>
          <p className="text-xs text-white/50">Clarity score</p>
        </div>
        <div className="hero-float-card hero-float-card-b">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">AI Risk</p>
          <p className="font-display text-2xl font-bold text-emerald-400">Low</p>
          <p className="text-xs text-white/50">Human-like tone</p>
        </div>
        <div className="hero-float-card hero-float-card-c">
          <p className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-300">Tools</p>
          <p className="font-display text-2xl font-bold text-white">30+</p>
          <p className="text-xs text-white/50">One workspace</p>
        </div>
      </div>

      <div className="hero-particles" />
    </div>
  );
}
