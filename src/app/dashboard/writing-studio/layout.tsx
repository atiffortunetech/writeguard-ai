import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function WritingStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolAccessGate
      featureId="writing-studio"
      featureName="Writing Studio"
      description="Advanced writing intelligence — scores, readability, tone, and AI detection in one scan"
    >
      {children}
    </ToolAccessGate>
  );
}
