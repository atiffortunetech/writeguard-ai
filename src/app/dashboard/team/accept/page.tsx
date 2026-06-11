"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/dashboard/team");
  };

  useEffect(() => {
    if (token) accept();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="py-12 text-center">
        {loading && <p className="text-sm text-slate-600">Accepting invitation...</p>}
        {error && (
          <>
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <Button asChild><Link href="/dashboard/team">Go to Team</Link></Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<div>Loading...</div>}><AcceptInvite /></Suspense>
    </div>
  );
}
