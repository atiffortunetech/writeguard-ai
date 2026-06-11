import { NextRequest } from "next/server";
import { listUsersWithDetails } from "@/lib/db";
import { requireApiAdmin } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q") ?? "";

  const users = await listUsersWithDetails(q || undefined);

  return Response.json(users);
}
