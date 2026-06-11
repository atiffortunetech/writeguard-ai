import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-utils";
import { getUserPlanTier } from "@/lib/usage";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const tier = await getUserPlanTier(auth.session.user.id);
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const filtered = templates.filter((t) => !t.isPremium || tier !== "FREE");
  return Response.json(filtered);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  if (auth.session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const template = await prisma.template.create({ data: body });
  return Response.json(template, { status: 201 });
}
