import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlanTier, getUserUsageThisMonth } from "@/lib/usage";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Sparkles,
  Mic2,
  Shield,
  ScanSearch,
  PenLine,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const quickActions = [
  { href: "/dashboard/writing-studio", label: "Writing Studio", icon: Sparkles },
  { href: "/dashboard/tools", label: "All Writing Tools", icon: Sparkles },
  { href: "/dashboard/tools/grammar-checker", label: "Grammar Checker", icon: Sparkles },
  { href: "/dashboard/humanizer", label: "AI Humanizer", icon: Sparkles },
  { href: "/dashboard/tools/paraphrase", label: "Paraphrase", icon: FileText },
  { href: "/dashboard/plagiarism", label: "Plagiarism Check", icon: Shield },
  { href: "/dashboard/ai-detector", label: "AI Detector", icon: ScanSearch },
  { href: "/dashboard/tools/ai-chat", label: "AI Chat", icon: PenLine },
  { href: "/dashboard/editor/new", label: "New Document", icon: PenLine },
];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [documents, tier, usage] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    getUserPlanTier(userId),
    getUserUsageThisMonth(userId),
  ]);

  const plan = PLAN_DEFINITIONS[tier];
  const creditsRemaining =
    plan.aiCreditsMonthly === -1
      ? "Unlimited"
      : Math.max(0, plan.aiCreditsMonthly - usage.aiRequests);

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        description="Your writing workspace overview"
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 grid gap-5 md:grid-cols-4">
          {[
            { label: "AI Credits Remaining", value: creditsRemaining, gradient: "from-violet-500 to-purple-600" },
            { label: "Documents", value: usage.documents, gradient: "from-cyan-500 to-blue-600" },
            { label: "AI Requests This Month", value: usage.aiRequests, gradient: "from-fuchsia-500 to-pink-600" },
            { label: "Current Plan", value: plan.name, gradient: "from-orange-500 to-amber-600", badge: tier },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card group overflow-hidden border-0">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="font-display flex items-center gap-2 text-2xl">
                  {stat.value}
                  {"badge" in stat && stat.badge && (
                    <Badge variant="secondary">{stat.badge}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="font-display mb-4 text-lg font-bold text-slate-900">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  variant="outline"
                  className="glass-card h-auto justify-start gap-3 border-0 py-4 hover:-translate-y-1"
                  asChild
                >
                  <Link href={action.href}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    {action.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/documents">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-sm text-slate-500">No documents yet.</p>
                <Button asChild>
                  <Link href="/dashboard/editor/new">Create your first document</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/editor/${doc.id}`}
                    className="flex items-center justify-between rounded-xl border border-violet-100/60 bg-white/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{doc.title}</p>
                      <p className="text-sm text-slate-500">
                        {doc.wordCount} words · Updated{" "}
                        {formatDistanceToNow(doc.updatedAt, { addSuffix: true })}
                      </p>
                    </div>
                    <FileText className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
