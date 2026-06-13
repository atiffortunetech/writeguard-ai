import { NextRequest } from "next/server";
import { listUsersWithDetails, countAIRequestLogs, findUserAccess } from "@/lib/db";
import { requireApiAdmin } from "@/lib/api-utils";
import { getEffectiveAccess } from "@/lib/access-control";
import {
  formatCreditLimitDisplay,
  formatToolsModeDisplay,
} from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const users = await listUsersWithDetails(q || undefined);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const enriched = await Promise.all(
    users.map(async (user) => {
      const [usageThisMonth, access, effective] = await Promise.all([
        countAIRequestLogs({ userId: user.id, since: startOfMonth }),
        findUserAccess(user.id),
        getEffectiveAccess(user.id),
      ]);

      const cap = effective.monthlyCredits;
      const creditsRemaining =
        cap === -1 ? null : Math.max(0, cap - usageThisMonth);

      return {
        ...user,
        access,
        accessSummary: {
          toolsMode: effective.toolsMode,
          toolsModeLabel: formatToolsModeDisplay(effective.toolsMode),
          creditLimit: effective.creditLimit,
          creditLimitLabel: formatCreditLimitDisplay(effective.creditLimit),
          monthlyCredits: cap,
          usageThisMonth,
          creditsRemaining,
          featureTier: effective.featureTier,
          source: effective.source,
        },
      };
    })
  );

  return Response.json(enriched);
}
