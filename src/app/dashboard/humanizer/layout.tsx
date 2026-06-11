import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function HumanizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="humanizer" featureName="AI Humanizer">
      {children}
    </ToolAccessGate>
  );
}
