import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function ParaphraseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolAccessGate
      featureId="paraphrase"
      featureName="Paraphrasing Tool"
      description="Rephrase text in multiple styles while keeping the same meaning"
    >
      {children}
    </ToolAccessGate>
  );
}
