import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function SopReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolAccessGate
      featureId="sop-reports"
      featureName="SOP & Reports"
      description="Generate SOPs, reports, and process guides with AI"
    >
      {children}
    </ToolAccessGate>
  );
}
