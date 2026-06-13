"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Mail, Copy, Check, Link2 } from "lucide-react";
import { parseApiJson } from "@/lib/parse-api-json";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  _count: { members: number; documents: number };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export default function TeamPage() {
  const [owned, setOwned] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<Array<{ workspace: Workspace; role: string }>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [members, setMembers] = useState<
    Array<{ id: string; role: string; user: { name: string | null; email: string } }>
  >([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const res = await fetch("/api/team/workspaces");
    const { data, parseError } = await parseApiJson<{
      owned?: Workspace[];
      memberships?: Array<{ workspace: Workspace; role: string }>;
    }>(res);
    if (parseError || !data) return;
    setOwned(data.owned ?? []);
    setMemberships(data.memberships ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const refreshWorkspace = async (id: string) => {
    const res = await fetch(`/api/team/workspaces/${id}`);
    const { data, parseError } = await parseApiJson<{
      members?: typeof members;
      invites?: PendingInvite[];
    }>(res);
    if (!parseError && data) {
      setMembers(data.members ?? []);
      setPendingInvites(data.invites ?? []);
    }
  };

  const loadWorkspace = async (id: string) => {
    setSelected(id);
    setInviteError(null);
    setInviteSuccess(null);
    setLastAcceptUrl(null);
    setEmailSent(null);
    await refreshWorkspace(id);
  };

  const createWorkspace = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    const res = await fetch("/api/team/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const { data, parseError } = await parseApiJson<{ error?: string }>(res);
    if (parseError) {
      setCreateError(parseError);
      return;
    }
    if (!res.ok) {
      setCreateError(data?.error ?? "Failed to create workspace");
      return;
    }
    setNewName("");
    setCreateSuccess("Workspace created");
    load();
  };

  const invite = async () => {
    if (!selected) return;
    setInviteError(null);
    setInviteSuccess(null);
    const res = await fetch(`/api/team/workspaces/${selected}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "EDITOR" }),
    });
    const { data, parseError } = await parseApiJson<{
      error?: string;
      message?: string;
      acceptUrl?: string;
      emailSent?: boolean;
    }>(res);
    if (parseError) {
      setInviteError(parseError);
      return;
    }
    if (!res.ok) {
      setInviteError(data?.error ?? "Failed to send invitation");
      return;
    }
    setInviteEmail("");
    setInviteSuccess(data?.message ?? "Invitation sent");
    setEmailSent(data?.emailSent ?? false);
    if (data?.acceptUrl) setLastAcceptUrl(data.acceptUrl);
    await refreshWorkspace(selected);
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const acceptUrlFor = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/team/accept?token=${token}`;

  const allWorkspaces = useMemo(() => {
    const byId = new Map<string, Workspace>();
    for (const w of owned) byId.set(w.id, w);
    for (const m of memberships) byId.set(m.workspace.id, m.workspace);
    return Array.from(byId.values());
  }, [owned, memberships]);

  return (
    <>
      <DashboardHeader
        title="Team Workspace"
        description="Collaborate with your team on shared writing resources"
      />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Workspace name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                {createSuccess && (
                  <p className="text-sm text-emerald-600">{createSuccess}</p>
                )}
                <Button onClick={createWorkspace} disabled={!newName}>
                  <Plus className="h-4 w-4" /> Create
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {allWorkspaces.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => loadWorkspace(w.id)}
                  className={`w-full rounded-lg border p-4 text-left ${
                    selected === w.id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-slate-500">
                    {w._count?.members ?? 0} members · {w._count?.documents ?? 0} docs
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selected ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-slate-500">
                  Select or create a workspace
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div>
                          <p className="font-medium">{m.user.name ?? m.user.email}</p>
                          <p className="text-sm text-slate-500">{m.user.email}</p>
                        </div>
                        <Badge variant="secondary">{m.role}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" /> Invite Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {emailSent === false && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-medium">Email not configured</p>
                        <p className="mt-1 text-xs text-amber-800">
                          Add <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> to{" "}
                          <code className="rounded bg-amber-100 px-1">.env</code> to send invite emails
                          automatically. Until then, copy the invite link below and share it manually.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Input
                        placeholder="email@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={invite} disabled={!inviteEmail}>
                        Send Invite
                      </Button>
                    </div>

                    {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
                    {inviteSuccess && (
                      <p className="text-sm text-emerald-600">{inviteSuccess}</p>
                    )}

                    {lastAcceptUrl && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-800">
                          <Link2 className="h-3.5 w-3.5" />
                          Latest invite link
                        </p>
                        <p className="break-all font-mono text-xs text-violet-900">
                          {lastAcceptUrl}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => copyLink(lastAcceptUrl)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copied ? "Copied" : "Copy link"}
                        </Button>
                      </div>
                    )}

                    {pendingInvites.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Pending invites
                        </p>
                        {pendingInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3 text-sm"
                          >
                            <div>
                              <p className="font-medium">{inv.email}</p>
                              <p className="text-xs text-slate-500">
                                {inv.role} · expires{" "}
                                {new Date(inv.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLink(acceptUrlFor(inv.token))}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy link
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Resending to the same email refreshes the invite link (7-day expiry).
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
