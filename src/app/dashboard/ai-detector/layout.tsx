import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function AiDetectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="ai-detector" featureName="AI Detector">
      {children}
    </ToolAccessGate>
  );
}
