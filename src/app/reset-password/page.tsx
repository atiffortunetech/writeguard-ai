"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/marketing/auth-shell";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: { token: string; password: string }) => {
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error); return; }
    router.push("/login");
  };

  return (
    <Card className="w-full max-w-md border-violet-100 shadow-lg">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("token")} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register("password")} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="btn-glow w-full border-0 text-white" disabled={isSubmitting || !token}>
            Reset password
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-violet-600 hover:underline">Back to login</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
