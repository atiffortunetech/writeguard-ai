import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function SmartRewriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolAccessGate
      featureId="smart-rewrite"
      featureName="Smart Rewrite"
      description="8 advanced rewrite modes — beyond basic paraphrase"
    >
      {children}
    </ToolAccessGate>
  );
}
