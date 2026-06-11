"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/marketing/auth-shell";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "Failed to create account");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell title="Create your account" subtitle="Start writing smarter today">
      <Card className="w-full max-w-md border-violet-100 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Get WriteGuard — It&apos;s free</CardTitle>
          <CardDescription>Create your account in under a minute</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="btn-glow w-full border-0 text-white" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500">
            By signing up, you agree to our Terms and Privacy Policy.
          </p>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
