"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Float3D } from "@/components/ui/float-3d";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8 text-white/50">Loading...</div>
    );
  }

  const plans = stats.planBreakdown as Array<{
    name: string;
    tier: string;
    _count: { subscriptions: number };
  }>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Analytics</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Float3D>
          <div className="admin-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-white">Plan Distribution</h2>
            <div className="space-y-4">
              {plans?.map((p) => (
                <div key={p.tier}>
                  <div className="mb-1 flex justify-between text-sm text-white/70">
                    <span>{p.name}</span>
                    <span>{p._count.subscriptions} users</span>
                  </div>
                  <Progress value={Math.min(100, p._count.subscriptions * 10)} />
                </div>
              ))}
            </div>
          </div>
        </Float3D>
        <Float3D>
          <div className="admin-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-white">Platform Usage</h2>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex justify-between">
                <span>Total documents</span>
                <span className="font-bold text-white">{stats.documentsCreated as number}</span>
              </div>
              <div className="flex justify-between">
                <span>AI requests this month</span>
                <span className="font-bold text-white">{stats.aiRequestsThisMonth as number}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly recurring revenue</span>
                <span className="font-bold text-white">${stats.mrr as number}</span>
              </div>
            </div>
          </div>
        </Float3D>
      </div>
    </div>
  );
}
