import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function BrandVoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="brand-voice" featureName="Brand Voice">
      {children}
    </ToolAccessGate>
  );
}
