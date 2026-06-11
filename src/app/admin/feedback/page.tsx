"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Array<{ id: string; message: string; rating: number | null; page: string | null; createdAt: string; user: { name: string | null; email: string } }>>([]);

  useEffect(() => {
    fetch("/api/admin/feedback").then((r) => r.json()).then(setFeedback);
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">User Feedback</h1>
      <div className="space-y-4">
        {feedback.map((f) => (
          <Card key={f.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{f.user.name ?? f.user.email}</CardTitle>
              {f.rating && <Badge>{f.rating} stars</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{f.message}</p>
              <p className="mt-2 text-xs text-slate-400">{f.page} · {new Date(f.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
