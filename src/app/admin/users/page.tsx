"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Unlock, Settings2 } from "lucide-react";

interface AccessSummary {
  toolsMode: string;
  toolsModeLabel: string;
  creditLimit: number | null;
  creditLimitLabel: string;
  monthlyCredits: number;
  usageThisMonth: number;
  creditsRemaining: number | null;
  featureTier: string;
  source: string;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  _count: { documents: number; aiRequestLogs: number };
  subscriptions: Array<{ plan: { name: string; tier: string } }>;
  accessSummary: AccessSummary;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customCredits, setCustomCredits] = useState("5000");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const action = async (userId: string, act: string) => {
    await fetch("/api/admin/stats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: act }),
    });
    load(search);
  };

  const applyPreset = async (userId: string, preset: string, extra?: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/admin/users/${userId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset, adminNotes: notes || undefined, ...extra }),
    });
    setSaving(false);
    setEditingId(null);
    setNotes("");
    load(search);
  };

  const creditDisplay = (summary: AccessSummary) => {
    if (summary.monthlyCredits === -1) {
      return `${summary.usageThisMonth} used · Unlimited`;
    }
    if (summary.monthlyCredits <= 0) {
      return `${summary.usageThisMonth} used · Locked (0)`;
    }
    return `${summary.usageThisMonth} / ${summary.monthlyCredits} used · ${summary.creditsRemaining ?? 0} left`;
  };

  return (
    <div className="p-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/50">
          Grant credits and tool access manually. Locked users are sent to Billing.
        </p>
      </div>

      <div className="mb-6 mt-6 flex gap-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm border-white/10 bg-white/5 text-white"
        />
        <Button variant="outline" onClick={() => load(search)} className="border-white/20 text-white hover:bg-white/10">
          Search
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="divide-y divide-white/10 p-0">
            {users.map((u) => {
              const s = u.accessSummary;
              const isLocked = s.toolsMode === "locked" && s.monthlyCredits <= 0;
              const isEditing = editingId === u.id;

              return (
                <div key={u.id} className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{u.name ?? "—"}</p>
                        {u.role === "ADMIN" && <Badge className="bg-violet-600">Admin</Badge>}
                        {isLocked && (
                          <Badge variant="destructive" className="gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                        {!isLocked && s.toolsMode === "all" && (
                          <Badge className="gap-1 bg-emerald-600">
                            <Unlock className="h-3 w-3" /> All tools
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-white/50">{u.email}</p>
                      <p className="mt-2 text-sm text-violet-300">{creditDisplay(s)}</p>
                      <p className="text-xs text-white/40">
                        Tools: {s.toolsModeLabel} · Tier: {s.featureTier} · Plan:{" "}
                        {u.subscriptions[0]?.plan.tier ?? "FREE"} · {u._count.documents} docs ·{" "}
                        {u._count.aiRequestLogs} total AI requests
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {u.role !== "ADMIN" && (
                        <>
                          <Button
                            size="sm"
                            className="btn-glow border-0 text-white"
                            disabled={saving}
                            onClick={() => applyPreset(u.id, "grant_all")}
                          >
                            Grant unlimited
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            disabled={saving}
                            onClick={() =>
                              setEditingId(isEditing ? null : u.id)
                            }
                          >
                            <Settings2 className="h-4 w-4" />
                            Custom
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={saving}
                            onClick={() => applyPreset(u.id, "lock")}
                          >
                            Lock
                          </Button>
                        </>
                      )}
                      {u.banned ? (
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => action(u.id, "unban")}>
                          Unban
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => action(u.id, "ban")}>
                          Ban
                        </Button>
                      )}
                      {u.role !== "ADMIN" && (
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => action(u.id, "make_admin")}>
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && u.role !== "ADMIN" && (
                    <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                      <p className="mb-3 text-sm font-semibold text-violet-200">Custom access</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-white/70">Monthly AI credits</Label>
                          <Input
                            value={customCredits}
                            onChange={(e) => setCustomCredits(e.target.value)}
                            placeholder="5000 or -1 for unlimited"
                            className="border-white/10 bg-black/40 text-white"
                          />
                          <p className="text-xs text-white/40">
                            Use -1 for unlimited, 0 to block AI, or any number
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">Admin notes</Label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Beta tester, friend, etc."
                            className="border-white/10 bg-black/40 text-white"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            applyPreset(u.id, "grant_custom", {
                              creditLimit: Number(customCredits),
                            })
                          }
                        >
                          Save custom credits + all tools
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => applyPreset(u.id, "follow_plan")}
                        >
                          Follow billing plan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
