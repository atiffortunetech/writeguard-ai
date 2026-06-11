"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  const plans = stats.planBreakdown as Array<{ name: string; tier: string; _count: { subscriptions: number } }>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Plan Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {plans?.map((p) => (
              <div key={p.tier}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span>{p._count.subscriptions} users</span>
                </div>
                <Progress value={Math.min(100, p._count.subscriptions * 10)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Platform Usage</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Total documents</span><span className="font-bold">{stats.documentsCreated as number}</span></div>
            <div className="flex justify-between"><span>AI requests this month</span><span className="font-bold">{stats.aiRequestsThisMonth as number}</span></div>
            <div className="flex justify-between"><span>Monthly recurring revenue</span><span className="font-bold">${stats.mrr as number}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
