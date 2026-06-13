"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MeshBackground } from "@/components/ui/mesh-background";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const toolLinks = [
  { href: "/dashboard/tools/sop-reports", label: "SOP & Reports", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-panel relative flex h-screen overflow-hidden bg-black text-slate-100">
      <MeshBackground variant="marketing" />
      <div className="marketing-noise" aria-hidden />
      <div className="marketing-grid-overlay opacity-40" aria-hidden />

      <aside className="relative z-10 flex w-64 flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-red-500/20">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin Panel</p>
            <p className="text-xs text-white/45">WriteGuard AI</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
            Manage
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "float-3d-nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-red-500/20 text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.15)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
            Tools
          </p>
          {toolLinks.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "float-3d-nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "nav-glow-active text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-white/60 hover:bg-white/5 hover:text-white"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
