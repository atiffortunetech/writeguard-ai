"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Float3D } from "@/components/ui/float-3d";

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<
    Array<{
      id: string;
      message: string;
      rating: number | null;
      page: string | null;
      createdAt: string;
      user: { name: string | null; email: string };
    }>
  >([]);

  useEffect(() => {
    fetch("/api/admin/feedback").then((r) => r.json()).then(setFeedback);
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">User Feedback</h1>
      <div className="space-y-4">
        {feedback.map((f) => (
          <Float3D key={f.id}>
            <div className="admin-card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-white">{f.user.name ?? f.user.email}</h2>
                {f.rating && <Badge>{f.rating} stars</Badge>}
              </div>
              <p className="text-sm text-white/70">{f.message}</p>
              <p className="mt-2 text-xs text-white/40">
                {f.page} · {new Date(f.createdAt).toLocaleString()}
              </p>
            </div>
          </Float3D>
        ))}
      </div>
    </div>
  );
}
