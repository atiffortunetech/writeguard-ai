import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function PlagiarismLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolAccessGate featureId="plagiarism" featureName="Plagiarism Checker">
      {children}
    </ToolAccessGate>
  );
}
