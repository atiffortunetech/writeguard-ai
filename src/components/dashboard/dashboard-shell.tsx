"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MeshBackground } from "@/components/ui/mesh-background";
import { Scene3DLayer } from "@/components/ui/scene-3d-layer";
import { DashboardShellContext } from "@/components/dashboard/dashboard-shell-context";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const shellValue = {
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
    menuOpen,
  };

  return (
    <DashboardShellContext.Provider value={shellValue}>
      <div className="dashboard-shell relative flex h-[100dvh] overflow-hidden bg-slate-950">
        <MeshBackground variant="dashboard" />
        <Scene3DLayer variant="dashboard" />
        <div className="dashboard-grid-overlay" aria-hidden />
        <div className="dashboard-orb dashboard-orb-a hidden sm:block" aria-hidden />
        <div className="dashboard-orb dashboard-orb-b hidden md:block" aria-hidden />

        {menuOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-2.5rem))] max-w-[88vw] shrink-0 transition-transform duration-300 ease-out lg:static lg:z-10 lg:w-64 lg:max-w-none lg:translate-x-0",
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <DashboardSidebar onNavigate={() => setMenuOpen(false)} />
        </div>

        <div className="dashboard-main relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
        </div>
      </div>
    </DashboardShellContext.Provider>
  );
}
