import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="templates" featureName="Content Templates">
      {children}
    </ToolAccessGate>
  );
}
