"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Float3D } from "@/components/ui/float-3d";

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8 text-white/50">Loading...</div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Paid Users", value: stats.paidUsers },
    { label: "Documents Created", value: stats.documentsCreated },
    { label: "AI Requests (Month)", value: stats.aiRequestsThisMonth },
    { label: "MRR", value: `$${stats.mrr}` },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-white">Admin Overview</h1>
      <p className="mb-8 text-white/50">SaaS metrics and platform health</p>

      <div className="mb-8 grid gap-4 md:grid-cols-5">
        {cards.map((c) => (
          <Float3D key={c.label}>
            <div className="admin-stat-card">
              <p className="text-sm font-medium text-white/45">{c.label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-white">
                {c.value as string | number}
              </p>
            </div>
          </Float3D>
        ))}
      </div>

      <Float3D>
        <div className="admin-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Recent Users</h2>
          <div className="space-y-3">
            {(
              stats.recentUsers as Array<{
                name: string | null;
                email: string;
                role: string;
                banned: boolean;
                createdAt: string;
              }>
            )?.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <p className="font-medium text-white">{u.name ?? u.email}</p>
                  <p className="text-sm text-white/45">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{u.role}</Badge>
                  {u.banned && <Badge variant="destructive">Banned</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Float3D>
    </div>
  );
}
