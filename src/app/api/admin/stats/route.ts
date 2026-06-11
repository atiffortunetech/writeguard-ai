import { NextRequest } from "next/server";
import {
  banUser,
  countActiveSubscriptions,
  countAIRequestLogs,
  countDocuments,
  countUsers,
  listActiveSubscriptionsWithPlans,
  listPlansWithSubscriptionCounts,
  listRecentUsers,
  makeUserAdmin,
  unbanUser,
} from "@/lib/db";
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
    countUsers(),
    countActiveSubscriptions(),
    countDocuments(),
    countAIRequestLogs({ since: startOfMonth }),
    listRecentUsers(10),
    listActiveSubscriptionsWithPlans(),
  ]);

  const mrr = subscriptions.reduce((sum, sub) => {
    if (sub.plan.tier === "PRO") return sum + sub.plan.priceMonthly;
    if (sub.plan.tier === "BUSINESS") return sum + sub.plan.priceMonthly;
    return sum;
  }, 0);

  const planBreakdown = await listPlansWithSubscriptionCounts();

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
    await banUser(userId);
  } else if (action === "unban") {
    await unbanUser(userId);
  } else if (action === "make_admin") {
    await makeUserAdmin(userId);
  } else {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  return Response.json({ success: true });
}
