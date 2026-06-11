"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/marketing/auth-shell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-violet-100 shadow-lg">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your WriteGuard AI account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-violet-600 hover:underline">
              Forgot password?
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-violet-600 hover:underline">
            Sign up free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to WriteGuard AI">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
