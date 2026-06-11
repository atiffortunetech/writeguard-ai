import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    paidUsers,
    documentsCreated,
    aiRequests,
    recentUsers,
    subscriptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({
      where: {
        status: { in: ["ACTIVE", "TRIALING"] },
        plan: { tier: { not: "FREE" } },
      },
    }),
    prisma.document.count(),
    prisma.aIRequestLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: true },
    }),
  ]);

  const mrr = subscriptions.reduce((sum, sub) => {
    if (sub.plan.tier === "PRO") return sum + sub.plan.priceMonthly;
    if (sub.plan.tier === "BUSINESS") return sum + sub.plan.priceMonthly;
    return sum;
  }, 0);

  const planBreakdown = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
  });

  return Response.json({
    totalUsers,
    paidUsers,
    documentsCreated,
    aiRequestsThisMonth: aiRequests,
    mrr,
    planBreakdown,
    recentUsers,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const { userId, action } = await req.json();
  if (!userId || !action) {
    return Response.json({ error: "userId and action required" }, { status: 400 });
  }

  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: true } });
  } else if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: false } });
  } else if (action === "make_admin") {
    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
  } else {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  return Response.json({ success: true });
}
