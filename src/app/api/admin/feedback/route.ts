import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  return Response.json(feedback);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;
  return Response.json({ error: "Use /api/feedback for submitting" }, { status: 405 });
}
