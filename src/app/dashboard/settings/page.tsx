"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string | null; email: string; emailVerified: string | null } | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user").then((r) => r.json()).then((d) => { setUser(d); setName(d.name ?? ""); });
  }, []);

  const updateProfile = async () => {
    setLoading(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    setMessage(res.ok ? "Profile updated" : "Failed to update");
  };

  const changePassword = async () => {
    setLoading(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage(res.ok ? "Password updated" : data.error);
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); }
  };

  const submitFeedback = async () => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: feedback, rating, page: "/dashboard/settings" }),
    });
    setFeedback("");
    setMessage("Thank you for your feedback!");
  };

  return (
    <>
      <DashboardHeader title="Settings" description="Manage your account and preferences" />
      <div className="flex-1 overflow-y-auto p-8">
        {message && <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">{message}</div>}

        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <Badge variant={user?.emailVerified ? "success" : "warning"}>
                  {user?.emailVerified ? "Email verified" : "Email not verified"}
                </Badge>
              </div>
              <Button onClick={updateProfile} disabled={loading}>Save Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Current password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>New password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
              <Button onClick={changePassword} disabled={loading}>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Confidential Mode skips storing content after AI processing when enabled per document.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">Enable Confidential Mode in the document editor when working with sensitive content.</p></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Send Feedback</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm">
                  {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
                </select>
              </div>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us what you think..." />
              <Button onClick={submitFeedback} disabled={!feedback}>Submit Feedback</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
