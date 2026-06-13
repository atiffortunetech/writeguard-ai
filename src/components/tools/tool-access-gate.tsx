import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/plan-features";
import { DashboardHeader } from "@/components/dashboard/header";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

export async function ToolAccessGate({
  featureId,
  featureName,
  description,
  children,
}: {
  featureId: string;
  featureName: string;
  description?: string;
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = await checkFeatureAccess(session.user.id, featureId);
  if (access.allowed) return <>{children}</>;

  return (
    <>
      <DashboardHeader
        title={featureName}
        description={description ?? "Upgrade your plan to unlock this tool"}
      />
      <div className="dashboard-content">
        <UpgradePrompt
          featureName={featureName}
          requiredTier={access.requiredTier}
          currentTier={access.currentTier}
        />
      </div>
    </>
  );
}
