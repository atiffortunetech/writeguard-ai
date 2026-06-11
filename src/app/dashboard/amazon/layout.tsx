import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function AmazonLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="amazon" featureName="Amazon Listing Optimizer">
      {children}
    </ToolAccessGate>
  );
}
