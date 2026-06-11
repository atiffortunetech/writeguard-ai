import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q") ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
      _count: { select: { documents: true, aiRequestLogs: true } },
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
        include: { plan: true },
        take: 1,
      },
    },
  });

  return Response.json(users);
}
