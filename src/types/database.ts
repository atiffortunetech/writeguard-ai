// Database types for MySQL layer (camelCase interfaces matching application conventions)

export type UserRole = "USER" | "TEAM_ADMIN" | "ADMIN";

export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export type PlanTier = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";

/** Admin-controlled tool access mode */
export type ToolsAccessMode = "locked" | "all" | "plan" | "tier";

export interface UserAccess {
  userId: string;
  /** NULL = use subscription plan credits, -1 = unlimited, 0 = none, N = monthly cap */
  creditLimit: number | null;
  toolsMode: ToolsAccessMode;
  featureTier: PlanTier | null;
  adminNotes: string | null;
  grantedById: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "INCOMPLETE";

export type SuggestionType =
  | "GRAMMAR"
  | "SPELLING"
  | "CLARITY"
  | "TONE"
  | "CONCISENESS"
  | "REWRITE"
  | "BRAND_VOICE"
  | "READABILITY"
  | "PUNCTUATION";

export type SuggestionSeverity = "LOW" | "MEDIUM" | "HIGH";

export type ActivityType =
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_DELETED"
  | "BRAND_VOICE_CREATED"
  | "BRAND_VOICE_UPDATED"
  | "STYLE_GUIDE_UPDATED"
  | "TEAM_MEMBER_INVITED"
  | "TEAM_MEMBER_REMOVED"
  | "SUBSCRIPTION_CHANGED"
  | "AI_REQUEST"
  | "PLAGIARISM_CHECK"
  | "AI_DETECTION_CHECK"
  | "BRAND_IMAGE_GENERATED";

export type EnglishVariant = "US" | "UK";

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  passwordHash: string | null;
  role: UserRole;
  banned: boolean;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
  tokenType: string | null;
  scope: string | null;
  idToken: string | null;
  sessionState: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  workspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  invitedAt: Date;
  joinedAt: Date | null;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  plainText: string;
  userId: string;
  workspaceId: string | null;
  folderId: string | null;
  brandVoiceId: string | null;
  styleGuideId: string | null;
  isConfidential: boolean;
  wordCount: number;
  characterCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  plainText: string;
  version: number;
  createdAt: Date;
}

export interface BrandVoice {
  id: string;
  name: string;
  brandName: string | null;
  targetAudience: string | null;
  tone: string | null;
  wordsToUse: string[];
  wordsToAvoid: string[];
  writingStyle: string | null;
  exampleContent: string | null;
  personality: string | null;
  industry: string | null;
  contentGoals: string | null;
  userId: string;
  workspaceId: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StyleGuide {
  id: string;
  name: string;
  englishVariant: EnglishVariant;
  forbiddenWords: string[];
  preferredWords: string[];
  capitalizationRules: string | null;
  toneRules: string | null;
  sentenceLengthPref: string | null;
  readingLevel: string | null;
  complianceRules: string | null;
  industryRules: string | null;
  userId: string;
  workspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Suggestion {
  id: string;
  documentId: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  originalText: string;
  suggestedText: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
  accepted: boolean | null;
  createdAt: Date;
}

export interface Plan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  aiCreditsMonthly: number;
  maxDocuments: number;
  maxBrandVoices: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface AIRequestLog {
  id: string;
  userId: string;
  endpoint: string;
  model: string | null;
  tokensUsed: number;
  promptTokens: number;
  success: boolean;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
}

export interface UsageLog {
  id: string;
  userId: string;
  action: string;
  quantity: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  prompt: string;
  fields: unknown[];
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlagiarismCheck {
  id: string;
  userId: string;
  content: string;
  similarityScore: number | null;
  matchedSources: unknown | null;
  highlights: unknown | null;
  provider: string | null;
  status: string;
  createdAt: Date;
}

export interface AIDetectionCheck {
  id: string;
  userId: string;
  content: string;
  aiProbability: number | null;
  humanProbability: number | null;
  mixedEstimate: number | null;
  highlights: unknown | null;
  provider: string | null;
  status: string;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  workspaceId: string | null;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  userId: string;
  rating: number | null;
  message: string;
  page: string | null;
  createdAt: Date;
}

export interface BrandImage {
  id: string;
  userId: string;
  title: string | null;
  sourceType: string;
  sourceText: string | null;
  imagePrompt: string;
  colors: Record<string, unknown>;
  stylePreset: string;
  aspectRatio: string;
  imageUrl: string;
  storagePath: string | null;
  referenceImageUrl: string | null;
  referenceStoragePath: string | null;
  mimeType: string;
  brandVoiceId: string | null;
  provider: string;
  createdAt: Date;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
