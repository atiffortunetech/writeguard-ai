"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Paid Users", value: stats.paidUsers },
    { label: "Documents Created", value: stats.documentsCreated },
    { label: "AI Requests (Month)", value: stats.aiRequestsThisMonth },
    { label: "MRR", value: `$${stats.mrr}` },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold">Admin Overview</h1>
      <p className="mb-8 text-slate-600">SaaS metrics and platform health</p>

      <div className="mb-8 grid gap-4 md:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">{c.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value as string | number}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats.recentUsers as Array<{ name: string | null; email: string; role: string; banned: boolean; createdAt: string }>)?.map((u, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{u.name ?? u.email}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{u.role}</Badge>
                  {u.banned && <Badge variant="destructive">Banned</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
