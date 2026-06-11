import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, apiError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;

  const document = await prisma.document.findFirst({
    where: { id, userId: auth.session.user.id },
  });
  if (!document) return apiError("Not found", 404);

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      plainText: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return Response.json(versions);
}
