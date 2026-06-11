import { ToolAccessGate } from "@/components/tools/tool-access-gate";

export default function BrandImagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolAccessGate
      featureId="brand-images"
      featureName="Brand Image Studio"
      description="Generate on-brand marketing images with OpenAI"
    >
      {children}
    </ToolAccessGate>
  );
}
