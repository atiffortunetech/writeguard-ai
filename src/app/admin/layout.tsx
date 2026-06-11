"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, BarChart3, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">A</div>
          <div>
            <p className="text-sm font-semibold">Admin Panel</p>
            <p className="text-xs text-slate-500">WriteGuard AI</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                active ? "bg-red-50 text-red-700" : "text-slate-600 hover:bg-slate-50"
              )}>
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start gap-2" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
