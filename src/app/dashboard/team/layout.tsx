import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="team" featureName="Team Workspace">
      {children}
    </ToolAccessGate>
  );
}
