"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  _count: { documents: number; aiRequestLogs: number };
  subscriptions: Array<{ plan: { name: string; tier: string } }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");

  const load = (q = "") => fetch(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  const action = async (userId: string, act: string) => {
    await fetch("/api/admin/stats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: act }),
    });
    load(search);
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>
      <div className="mb-6 flex gap-3">
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" onClick={() => load(search)}>Search</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{u.name ?? "—"}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                  <p className="text-xs text-slate-400">{u._count.documents} docs · {u._count.aiRequestLogs} AI requests</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{u.subscriptions[0]?.plan.tier ?? "FREE"}</Badge>
                  {u.banned ? (
                    <Button size="sm" variant="outline" onClick={() => action(u.id, "unban")}>Unban</Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => action(u.id, "ban")}>Ban</Button>
                  )}
                  {u.role !== "ADMIN" && (
                    <Button size="sm" variant="outline" onClick={() => action(u.id, "make_admin")}>Make Admin</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
