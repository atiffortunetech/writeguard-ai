export const BRAND_IMAGE_PROMPT_SYSTEM = `You are an expert marketing art director. Given user content and brand colors, write a detailed image generation prompt for a professional marketing visual.

Output ONLY valid JSON:
{
  "title": "short title for the image (max 60 chars)",
  "imagePrompt": "detailed prompt for image generation (150-400 words). Include composition, lighting, mood, subjects, and EXACT brand hex colors for primary/secondary/accent usage. No text or logos in the image unless user explicitly asks.",
  "summary": "one sentence describing what will be generated"
}

Rules:
- Use the brand hex colors explicitly in the imagePrompt (e.g. "dominant violet #7C3AED accents").
- Match the style preset (social banner, hero, product, minimal, etc.).
- Professional, modern, suitable for SaaS/marketing.
- Do NOT include watermarks or UI chrome unless requested.
- Avoid generating readable text inside the image (text overlays are added separately in the app).
- If a reference image analysis is provided, match its composition, layout, mood, and subject style while applying the brand colors.`;

export interface BrandImagePromptInput {
  sourceType: "prompt" | "text" | "document";
  sourceText: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  stylePreset: string;
  aspectRatio: string;
  brandVoiceContext?: string;
  /** Vision analysis of an optional user reference image */
  referenceImageContext?: string;
  /** User-edited prompt override for regenerate */
  promptOverride?: string;
}

export function buildBrandImagePromptRequest(input: BrandImagePromptInput): string {
  if (input.promptOverride?.trim()) {
    return `Refine this image generation prompt for brand consistency. Keep the user's intent but improve clarity and color usage.

User prompt to refine:
${input.promptOverride}

Brand colors:
- Primary: ${input.colors.primary}
- Secondary: ${input.colors.secondary}
- Accent: ${input.colors.accent}
- Background: ${input.colors.background}

Style preset: ${input.stylePreset}
Aspect ratio: ${input.aspectRatio}
${input.brandVoiceContext ? `\nBrand voice:\n${input.brandVoiceContext}` : ""}${input.referenceImageContext ? `\n\nReference image analysis (match this look & feel):\n${input.referenceImageContext}` : ""}`;
  }

  return `Create an image generation prompt from this input.

Source type: ${input.sourceType}
Content:
${input.sourceText}

Brand colors:
- Primary: ${input.colors.primary}
- Secondary: ${input.colors.secondary}
- Accent: ${input.colors.accent}
- Background: ${input.colors.background}

Style preset: ${input.stylePreset}
Aspect ratio: ${input.aspectRatio}
${input.brandVoiceContext ? `\nBrand voice:\n${input.brandVoiceContext}` : ""}${input.referenceImageContext ? `\n\nReference image analysis (match this look & feel):\n${input.referenceImageContext}` : ""}`;
}

export const STYLE_PRESETS: Record<string, string> = {
  "social-banner": "Social media banner, bold and scroll-stopping, clean layout",
  hero: "Website hero section background, spacious, premium SaaS aesthetic",
  product: "Product showcase / e-commerce lifestyle shot, professional lighting",
  minimal: "Minimal flat illustration, lots of whitespace, modern",
  bold: "High contrast, vibrant gradients, energetic marketing visual",
  corporate: "Corporate professional, trustworthy, subdued palette",
};
