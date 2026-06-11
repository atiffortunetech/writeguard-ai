"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/marketing/auth-shell";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { setError("Something went wrong"); return; }
    setSent(true);
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link">
      <Card className="w-full max-w-md border-violet-100 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Forgot password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-center text-sm text-slate-600">
              If an account exists, a reset link was sent. Check your email.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="btn-glow w-full border-0 text-white" disabled={isSubmitting}>
                Send reset link
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-violet-600 hover:underline">Back to login</Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
