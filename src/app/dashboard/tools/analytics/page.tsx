import { auth } from "@/lib/auth";
import { countDocuments, listAIRequestLogsByUserId } from "@/lib/db";
import { getUserUsageThisMonth, getUserPlanTier } from "@/lib/usage";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function WritingAnalyticsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [usage, tier, recentLogs, docCount] = await Promise.all([
    getUserUsageThisMonth(userId),
    getUserPlanTier(userId),
    listAIRequestLogsByUserId(userId, { limit: 10 }),
    countDocuments(userId),
  ]);

  const plan = PLAN_DEFINITIONS[tier];
  const creditLimit = plan.aiCreditsMonthly === -1 ? null : plan.aiCreditsMonthly;
  const creditUsed = usage.aiRequests;
  const creditPct = creditLimit ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;

  return (
    <>
      <DashboardHeader
        title="Writing Analytics"
        description="Your usage, AI activity, and workspace stats"
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 grid gap-5 md:grid-cols-4">
          {[
            { label: "Documents", value: docCount },
            { label: "AI Requests (month)", value: usage.aiRequests },
            { label: "Plan", value: plan.name },
            {
              label: "Credits left",
              value: creditLimit === null ? "Unlimited" : Math.max(0, creditLimit - creditUsed),
            },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="font-display text-2xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {creditLimit !== null && (
          <Card className="glass-card mb-8 border-0">
            <CardHeader>
              <CardTitle>AI Credits This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={creditPct} className="mb-2 h-3" />
              <p className="text-sm text-slate-500">
                {creditUsed} of {creditLimit} used
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Recent AI Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No AI activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-violet-100 p-3 text-sm"
                  >
                    <span className="text-slate-700">{log.endpoint}</span>
                    <span className="text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
