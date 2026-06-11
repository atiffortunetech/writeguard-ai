import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireApiAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireApiAdmin() {
  const result = await requireApiAuth();
  if ("error" in result) return result;
  if (result.session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
