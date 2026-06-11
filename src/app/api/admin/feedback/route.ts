import { NextRequest } from "next/server";
import { listFeedback } from "@/lib/db";
import { requireApiAdmin } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const feedback = await listFeedback({ limit: 50 });

  return Response.json(feedback);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;
  return Response.json({ error: "Use /api/feedback for submitting" }, { status: 405 });
}
