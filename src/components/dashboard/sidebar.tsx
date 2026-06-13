"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  PenLine,
  LayoutGrid,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Lock,
  ImageIcon,
  Brain,
  ClipboardList,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  getToolHref,
} from "@/lib/tools-registry";
import { useEffect, useState } from "react";
import {
  FEATURE_MIN_TIER,
  isFeatureUnlockedForTier,
  featureIdForToolSlug,
} from "@/lib/plan-tiers";
import type { PlanTier } from "@/types/database";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { useDashboardShell } from "@/components/dashboard/dashboard-shell-context";

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

const coreLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/writing-studio", label: "Writing Studio", icon: Brain, featureId: "writing-studio" },
  { href: "/dashboard/tools/sop-reports", label: "SOP & Reports", icon: ClipboardList, featureId: "sop-reports" },
  { href: "/dashboard/tools", label: "All Tools", icon: LayoutGrid },
  { href: "/dashboard/brand-images", label: "Brand Images", icon: ImageIcon, featureId: "brand-images" },
  { href: "/dashboard/editor/new", label: "New Document", icon: PenLine },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
];

const accountLinks = [
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const shell = useDashboardShell();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [tier, setTier] = useState<PlanTier>("FREE");
  const [planLoaded, setPlanLoaded] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    TOOL_CATEGORIES.forEach((c) => {
      initial[c] =
        c === "Correctness" || c === "AI Intelligence" || c === "Productivity";
    });
    return initial;
  });

  useEffect(() => {
    fetch("/api/plan/features")
      .then((r) => r.json())
      .then((d) => {
        setTier(d.tier ?? "FREE");
        setPlanLoaded(true);
      });
  }, []);

  const toggle = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const closeNav = () => {
    onNavigate?.();
    shell?.closeMenu();
  };

  const navLinkProps = { onClick: () => closeNav() };

  return (
    <aside className="relative flex h-full w-full flex-col glass-panel-dark text-white lg:w-64">
      <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-violet-500 via-cyan-400 to-fuchsia-500 opacity-80" />

      <div className="relative flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white shadow-lg">
            W
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-bold tracking-tight">WriteGuard AI</p>
            <p className="truncate text-[11px] text-violet-300/70">Writing workspace</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-violet-200/80 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => shell?.closeMenu()}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 space-y-0.5">
          {coreLinks.map((item) => {
            const Icon = item.icon;
            const locked =
              "featureId" in item &&
              item.featureId &&
              planLoaded &&
              !isAdmin &&
              !isFeatureUnlockedForTier(item.featureId, tier);
            const href = locked ? "/dashboard/billing" : item.href;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={href}
                {...navLinkProps}
                className={cn(
                  "float-3d-nav flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "nav-glow-active text-white"
                    : "text-violet-200/70 hover:bg-white/5 hover:text-white",
                  locked && "opacity-70"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3 w-3 text-violet-400/80" />}
              </Link>
            );
          })}
        </div>

        {TOOL_CATEGORIES.filter((c) => c !== "Core").map((category) => {
          const tools = getToolsByCategory(category);
          if (tools.length === 0) return null;
          const open = openCategories[category] ?? false;

          return (
            <div key={category} className="mt-2">
              <button
                type="button"
                onClick={() => toggle(category)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-violet-400/70 hover:text-violet-300"
              >
                {category}
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
                />
              </button>
              {open && (
                <div className="space-y-0.5 pb-1">
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    const fid = featureIdForToolSlug(tool.slug);
                    const unlocked =
                      isAdmin ||
                      tool.type === "counter" ||
                      !planLoaded ||
                      isFeatureUnlockedForTier(fid, tier);
                    const href = unlocked ? getToolHref(tool) : "/dashboard/billing";
                    const active = isActive(href);
                    const required = FEATURE_MIN_TIER[fid] ?? "PRO";
                    return (
                      <Link
                        key={tool.slug}
                        href={href}
                        {...navLinkProps}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-all",
                          active
                            ? "nav-glow-active text-white"
                            : "text-violet-200/60 hover:bg-white/5 hover:text-white",
                          !unlocked && planLoaded && "opacity-70"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">{tool.title}</span>
                        {!unlocked && planLoaded && (
                          <span title={`Requires ${PLAN_DEFINITIONS[required].name}`}>
                            <Lock className="h-3 w-3 shrink-0 text-violet-400/80" />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4 space-y-0.5 border-t border-white/10 pt-3">
          {accountLinks.map((item) => {
            const Icon = item.icon;
            const teamLocked =
              item.href === "/dashboard/team" &&
              planLoaded &&
              !isAdmin &&
              !isFeatureUnlockedForTier("team", tier);
            const href = teamLocked ? "/dashboard/billing" : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                {...navLinkProps}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-violet-200/70 hover:bg-white/5 hover:text-white",
                  isActive(item.href) && "nav-glow-active text-white",
                  teamLocked && "opacity-70"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {teamLocked && <Lock className="h-3 w-3 text-violet-400/80" />}
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <Link
            href="/admin"
            {...navLinkProps}
            className={cn(
              "mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
              pathname.startsWith("/admin")
                ? "bg-red-500/20 text-red-300"
                : "text-violet-200/70 hover:bg-white/5"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-violet-200/70 hover:bg-white/5 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
