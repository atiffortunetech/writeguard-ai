import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function StyleGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="style-guide" featureName="Style Guide">
      {children}
    </ToolAccessGate>
  );
}
