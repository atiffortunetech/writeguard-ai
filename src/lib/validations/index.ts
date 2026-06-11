import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const analyzeSchema = z.object({
  text: z.string().min(1, "Text is required").max(50000, "Text too long"),
  documentId: z.string().nullish(),
  brandVoiceId: z.string().nullish(),
  styleGuideId: z.string().nullish(),
});

export const rewriteSchema = z.object({
  text: z.string().min(1, "Text is required").max(50000, "Text too long"),
  action: z.string().min(1),
  targetTone: z.string().nullish(),
  brandVoiceId: z.string().nullish(),
  documentId: z.string().nullish(),
});

export const brandVoiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  brandName: z.string().max(100).optional(),
  targetAudience: z.string().max(2000).optional(),
  tone: z.string().max(200).optional(),
  wordsToUse: z.array(z.string()).default([]),
  wordsToAvoid: z.array(z.string()).default([]),
  writingStyle: z.string().max(2000).optional(),
  exampleContent: z.string().max(10000).optional(),
  personality: z.string().max(1000).optional(),
  industry: z.string().max(200).optional(),
  contentGoals: z.string().max(2000).optional(),
  isDefault: z.boolean().default(false),
  workspaceId: z.string().optional(),
});

export const styleGuideSchema = z.object({
  name: z.string().min(1).max(100).default("Default Style Guide"),
  englishVariant: z.enum(["US", "UK"]).default("US"),
  forbiddenWords: z.array(z.string()).default([]),
  preferredWords: z.array(z.string()).default([]),
  capitalizationRules: z.string().max(2000).optional(),
  toneRules: z.string().max(2000).optional(),
  sentenceLengthPref: z.string().max(200).optional(),
  readingLevel: z.string().max(200).optional(),
  complianceRules: z.string().max(2000).optional(),
  industryRules: z.string().max(2000).optional(),
  workspaceId: z.string().optional(),
});

export const documentSchema = z.object({
  title: z.string().min(1).max(200).default("Untitled Document"),
  content: z.string().default(""),
  plainText: z.string().default(""),
  brandVoiceId: z.string().nullable().optional(),
  styleGuideId: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  isConfidential: z.boolean().default(false),
});

export const amazonListingSchema = z.object({
  productName: z.string().min(1).max(200),
  brandName: z.string().max(100).optional(),
  features: z.string().max(5000).optional(),
  targetAudience: z.string().max(1000).optional(),
  mainKeywords: z.string().max(1000).optional(),
  competitorNotes: z.string().max(2000).optional(),
  wordsToAvoid: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  marketplace: z.string().max(50).default("US"),
  brandVoiceId: z.string().nullish(),
});

export const humanizeSchema = z.object({
  text: z.string().min(1).max(50000),
  mode: z.string().default("general"),
  intensity: z
    .enum(["quality", "balanced", "enhanced", "standard", "deep", "maximum"])
    .default("enhanced"),
  preserveFormat: z.boolean().default(true),
  brandVoiceId: z.string().nullish(),
});

export const contentGenerateSchema = z.object({
  templateSlug: z.string().min(1),
  inputs: z.record(z.string(), z.string()),
  tone: z.string().nullish(),
  brandVoiceId: z.string().nullish(),
});

export const plagiarismSchema = z.object({
  text: z.string().min(1).max(50000),
});

export const aiDetectionSchema = z.object({
  text: z.string().min(1).max(50000),
});

export const workspaceSchema = z.object({
  name: z.string().min(2).max(100),
});

export const teamInviteSchema = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("EDITOR"),
});

export const feedbackSchema = z.object({
  message: z.string().min(1).max(2000),
  rating: z.number().min(1).max(5).optional(),
  page: z.string().optional(),
});

export const folderSchema = z.object({
  name: z.string().min(1).max(100),
  workspaceId: z.string().optional(),
});

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Invalid hex color");

export const brandImageColorsSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
});

export const brandImageReferenceSchema = z.object({
  base64: z
    .string()
    .min(100)
    .max(6_000_000, "Reference image is too large (max ~4 MB)"),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});

export const brandImageGenerateSchema = z
  .object({
    sourceType: z.enum(["prompt", "text", "document"]),
    sourceText: z.string().max(10000).default(""),
    colors: brandImageColorsSchema,
    stylePreset: z
      .enum(["social-banner", "hero", "product", "minimal", "bold", "corporate"])
      .default("social-banner"),
    aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3"]).default("16:9"),
    brandVoiceId: z.string().nullish(),
    documentId: z.string().nullish(),
    promptOverride: z.string().max(4000).nullish(),
    title: z.string().max(120).nullish(),
    referenceImage: brandImageReferenceSchema.nullish(),
  })
  .refine(
    (d) =>
      Boolean(d.promptOverride?.trim()) ||
      Boolean(d.documentId) ||
      d.sourceText.trim().length >= 3,
    { message: "Provide at least 3 characters, select a document, or use prompt override" }
  );

export type BrandImageGenerateInput = z.infer<typeof brandImageGenerateSchema>;

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BrandVoiceInput = z.infer<typeof brandVoiceSchema>;
export type StyleGuideInput = z.infer<typeof styleGuideSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type AmazonListingInput = z.infer<typeof amazonListingSchema>;
