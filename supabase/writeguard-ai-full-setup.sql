-- =============================================================================
-- WriteGuard AI — Full Supabase Database Setup
-- =============================================================================
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
--
-- What this does:
--   1. Drops existing WriteGuard tables (safe re-run)
--   2. Creates all enums, tables, indexes, foreign keys
--   3. Adds auto-update triggers for "updatedAt" columns
--   4. Seeds subscription plans + 15 content templates
--
-- After running:
--   1. Set DATABASE_URL in .env to your Supabase pooler connection string
--   2. Run: npm run dev
--   3. Sign up at http://localhost:3000/signup
--   4. Make yourself admin (see bottom of this file)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- CLEANUP (drops everything WriteGuard-related — safe for fresh install)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS "Feedback"           CASCADE;
DROP TABLE IF EXISTS "ActivityLog"        CASCADE;
DROP TABLE IF EXISTS "AIDetectionCheck"   CASCADE;
DROP TABLE IF EXISTS "PlagiarismCheck"    CASCADE;
DROP TABLE IF EXISTS "UsageLog"           CASCADE;
DROP TABLE IF EXISTS "AIRequestLog"       CASCADE;
DROP TABLE IF EXISTS "Invoice"            CASCADE;
DROP TABLE IF EXISTS "Subscription"       CASCADE;
DROP TABLE IF EXISTS "Suggestion"         CASCADE;
DROP TABLE IF EXISTS "DocumentVersion"    CASCADE;
DROP TABLE IF EXISTS "Document"           CASCADE;
DROP TABLE IF EXISTS "StyleGuide"         CASCADE;
DROP TABLE IF EXISTS "BrandVoice"         CASCADE;
DROP TABLE IF EXISTS "WorkspaceMember"    CASCADE;
DROP TABLE IF EXISTS "TeamInvite"         CASCADE;
DROP TABLE IF EXISTS "Folder"             CASCADE;
DROP TABLE IF EXISTS "Workspace"          CASCADE;
DROP TABLE IF EXISTS "Template"           CASCADE;
DROP TABLE IF EXISTS "Plan"               CASCADE;
DROP TABLE IF EXISTS "VerificationToken"  CASCADE;
DROP TABLE IF EXISTS "Session"            CASCADE;
DROP TABLE IF EXISTS "Account"            CASCADE;
DROP TABLE IF EXISTS "User"               CASCADE;

DROP TYPE IF EXISTS "ActivityType"        CASCADE;
DROP TYPE IF EXISTS "EnglishVariant"      CASCADE;
DROP TYPE IF EXISTS "SuggestionSeverity"  CASCADE;
DROP TYPE IF EXISTS "SuggestionType"      CASCADE;
DROP TYPE IF EXISTS "SubscriptionStatus"  CASCADE;
DROP TYPE IF EXISTS "PlanTier"            CASCADE;
DROP TYPE IF EXISTS "WorkspaceRole"       CASCADE;
DROP TYPE IF EXISTS "UserRole"            CASCADE;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('USER', 'TEAM_ADMIN', 'ADMIN');

CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE');

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE');

CREATE TYPE "SuggestionType" AS ENUM (
  'GRAMMAR', 'SPELLING', 'CLARITY', 'TONE', 'CONCISENESS',
  'REWRITE', 'BRAND_VOICE', 'READABILITY', 'PUNCTUATION'
);

CREATE TYPE "SuggestionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "ActivityType" AS ENUM (
  'DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED',
  'BRAND_VOICE_CREATED', 'BRAND_VOICE_UPDATED', 'STYLE_GUIDE_UPDATED',
  'TEAM_MEMBER_INVITED', 'TEAM_MEMBER_REMOVED', 'SUBSCRIPTION_CHANGED',
  'AI_REQUEST', 'PLAGIARISM_CHECK', 'AI_DETECTION_CHECK'
);

CREATE TYPE "EnglishVariant" AS ENUM ('US', 'UK');

-- ---------------------------------------------------------------------------
-- HELPER: auto-update "updatedAt" on row change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION writeguard_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- USERS & AUTH (Auth.js / NextAuth)
-- ---------------------------------------------------------------------------
CREATE TABLE "User" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  "image"         TEXT,
  "passwordHash"  TEXT,
  "role"          "UserRole" NOT NULL DEFAULT 'USER',
  "banned"        BOOLEAN NOT NULL DEFAULT FALSE,
  "suspendedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_role_idx"  ON "User" ("role");

CREATE TRIGGER "User_updatedAt"
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

-- OAuth accounts (Google login)
CREATE TABLE "Account" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  UNIQUE ("provider", "providerAccountId")
);

-- Sessions (Auth.js JWT adapter still uses this table)
CREATE TABLE "Session" (
  "id"           TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires"      TIMESTAMPTZ NOT NULL
);

-- Email verification + password reset tokens
CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMPTZ NOT NULL,
  UNIQUE ("identifier", "token")
);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTION PLANS
-- ---------------------------------------------------------------------------
CREATE TABLE "Plan" (
  "id"                   TEXT PRIMARY KEY,
  "tier"                 "PlanTier" NOT NULL UNIQUE,
  "name"                 TEXT NOT NULL,
  "description"          TEXT,
  "priceMonthly"         INTEGER NOT NULL DEFAULT 0,
  "priceYearly"          INTEGER NOT NULL DEFAULT 0,
  "stripePriceIdMonthly" TEXT,
  "stripePriceIdYearly"  TEXT,
  "aiCreditsMonthly"     INTEGER NOT NULL DEFAULT 50,
  "maxDocuments"         INTEGER NOT NULL DEFAULT 5,
  "maxBrandVoices"       INTEGER NOT NULL DEFAULT 0,
  "features"             JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isActive"             BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER "Plan_updatedAt"
  BEFORE UPDATE ON "Plan"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

-- ---------------------------------------------------------------------------
-- WORKSPACES & TEAMS
-- ---------------------------------------------------------------------------
CREATE TABLE "Workspace" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL UNIQUE,
  "ownerId"   TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Workspace_ownerId_idx" ON "Workspace" ("ownerId");
CREATE INDEX "Workspace_slug_idx"    ON "Workspace" ("slug");

CREATE TRIGGER "Workspace_updatedAt"
  BEFORE UPDATE ON "Workspace"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

CREATE TABLE "Folder" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "workspaceId" TEXT REFERENCES "Workspace"("id") ON DELETE SET NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Folder_userId_idx"      ON "Folder" ("userId");
CREATE INDEX "Folder_workspaceId_idx" ON "Folder" ("workspaceId");

CREATE TRIGGER "Folder_updatedAt"
  BEFORE UPDATE ON "Folder"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

CREATE TABLE "TeamInvite" (
  "id"          TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "email"       TEXT NOT NULL,
  "role"        "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
  "token"       TEXT NOT NULL UNIQUE,
  "invitedById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "acceptedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("workspaceId", "email")
);

CREATE INDEX "TeamInvite_token_idx" ON "TeamInvite" ("token");

CREATE TABLE "WorkspaceMember" (
  "id"          TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role"        "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
  "invitedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "joinedAt"    TIMESTAMPTZ,
  UNIQUE ("workspaceId", "userId")
);

CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember" ("userId");

-- ---------------------------------------------------------------------------
-- BRAND VOICE & STYLE GUIDE
-- ---------------------------------------------------------------------------
CREATE TABLE "BrandVoice" (
  "id"             TEXT PRIMARY KEY,
  "name"           TEXT NOT NULL,
  "brandName"      TEXT,
  "targetAudience" TEXT,
  "tone"           TEXT,
  "wordsToUse"     TEXT[] NOT NULL DEFAULT '{}',
  "wordsToAvoid"   TEXT[] NOT NULL DEFAULT '{}',
  "writingStyle"   TEXT,
  "exampleContent" TEXT,
  "personality"    TEXT,
  "industry"       TEXT,
  "contentGoals"   TEXT,
  "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "workspaceId"    TEXT REFERENCES "Workspace"("id") ON DELETE SET NULL,
  "isDefault"      BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "BrandVoice_userId_idx"      ON "BrandVoice" ("userId");
CREATE INDEX "BrandVoice_workspaceId_idx" ON "BrandVoice" ("workspaceId");

CREATE TRIGGER "BrandVoice_updatedAt"
  BEFORE UPDATE ON "BrandVoice"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

CREATE TABLE "StyleGuide" (
  "id"                  TEXT PRIMARY KEY,
  "name"                TEXT NOT NULL DEFAULT 'Default Style Guide',
  "englishVariant"      "EnglishVariant" NOT NULL DEFAULT 'US',
  "forbiddenWords"      TEXT[] NOT NULL DEFAULT '{}',
  "preferredWords"      TEXT[] NOT NULL DEFAULT '{}',
  "capitalizationRules" TEXT,
  "toneRules"           TEXT,
  "sentenceLengthPref"  TEXT,
  "readingLevel"        TEXT,
  "complianceRules"     TEXT,
  "industryRules"       TEXT,
  "userId"              TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "workspaceId"         TEXT REFERENCES "Workspace"("id") ON DELETE SET NULL,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "StyleGuide_userId_idx"      ON "StyleGuide" ("userId");
CREATE INDEX "StyleGuide_workspaceId_idx" ON "StyleGuide" ("workspaceId");

CREATE TRIGGER "StyleGuide_updatedAt"
  BEFORE UPDATE ON "StyleGuide"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

-- ---------------------------------------------------------------------------
-- DOCUMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE "Document" (
  "id"             TEXT PRIMARY KEY,
  "title"          TEXT NOT NULL DEFAULT 'Untitled Document',
  "content"        TEXT NOT NULL DEFAULT '',
  "plainText"      TEXT NOT NULL DEFAULT '',
  "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "workspaceId"    TEXT REFERENCES "Workspace"("id") ON DELETE SET NULL,
  "folderId"       TEXT REFERENCES "Folder"("id") ON DELETE SET NULL,
  "brandVoiceId"   TEXT REFERENCES "BrandVoice"("id") ON DELETE SET NULL,
  "styleGuideId"   TEXT REFERENCES "StyleGuide"("id") ON DELETE SET NULL,
  "isConfidential" BOOLEAN NOT NULL DEFAULT FALSE,
  "wordCount"      INTEGER NOT NULL DEFAULT 0,
  "characterCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Document_userId_idx"      ON "Document" ("userId");
CREATE INDEX "Document_workspaceId_idx" ON "Document" ("workspaceId");
CREATE INDEX "Document_folderId_idx"    ON "Document" ("folderId");
CREATE INDEX "Document_updatedAt_idx"   ON "Document" ("updatedAt");

CREATE TRIGGER "Document_updatedAt"
  BEFORE UPDATE ON "Document"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

CREATE TABLE "DocumentVersion" (
  "id"         TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content"    TEXT NOT NULL,
  "plainText"  TEXT NOT NULL,
  "version"    INTEGER NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion" ("documentId");

CREATE TABLE "Suggestion" (
  "id"            TEXT PRIMARY KEY,
  "documentId"    TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "type"          "SuggestionType" NOT NULL,
  "severity"      "SuggestionSeverity" NOT NULL DEFAULT 'MEDIUM',
  "originalText"  TEXT NOT NULL,
  "suggestedText" TEXT NOT NULL,
  "explanation"   TEXT NOT NULL,
  "startIndex"    INTEGER NOT NULL,
  "endIndex"      INTEGER NOT NULL,
  "accepted"      BOOLEAN,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Suggestion_documentId_idx" ON "Suggestion" ("documentId");

-- ---------------------------------------------------------------------------
-- BILLING
-- ---------------------------------------------------------------------------
CREATE TABLE "Subscription" (
  "id"                   TEXT PRIMARY KEY,
  "userId"               TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "planId"               TEXT NOT NULL REFERENCES "Plan"("id"),
  "stripeCustomerId"     TEXT,
  "stripeSubscriptionId" TEXT UNIQUE,
  "status"               "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodStart"   TIMESTAMPTZ,
  "currentPeriodEnd"     TIMESTAMPTZ,
  "cancelAtPeriodEnd"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Subscription_userId_idx"           ON "Subscription" ("userId");
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription" ("stripeCustomerId");

CREATE TRIGGER "Subscription_updatedAt"
  BEFORE UPDATE ON "Subscription"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

CREATE TABLE "Invoice" (
  "id"              TEXT PRIMARY KEY,
  "subscriptionId"  TEXT NOT NULL REFERENCES "Subscription"("id") ON DELETE CASCADE,
  "stripeInvoiceId" TEXT UNIQUE,
  "amount"          INTEGER NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'usd',
  "status"          TEXT NOT NULL,
  "paidAt"          TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- USAGE & LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE "AIRequestLog" (
  "id"           TEXT PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "endpoint"     TEXT NOT NULL,
  "model"        TEXT,
  "tokensUsed"   INTEGER NOT NULL DEFAULT 0,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "success"      BOOLEAN NOT NULL DEFAULT TRUE,
  "errorMessage" TEXT,
  "durationMs"   INTEGER,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "AIRequestLog_userId_idx"    ON "AIRequestLog" ("userId");
CREATE INDEX "AIRequestLog_createdAt_idx" ON "AIRequestLog" ("createdAt");

CREATE TABLE "UsageLog" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "action"    TEXT NOT NULL,
  "quantity"  INTEGER NOT NULL DEFAULT 1,
  "metadata"  JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "UsageLog_userId_idx"    ON "UsageLog" ("userId");
CREATE INDEX "UsageLog_action_idx"    ON "UsageLog" ("action");
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog" ("createdAt");

CREATE TABLE "ActivityLog" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "workspaceId" TEXT REFERENCES "Workspace"("id") ON DELETE SET NULL,
  "type"        "ActivityType" NOT NULL,
  "description" TEXT NOT NULL,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "ActivityLog_userId_idx"      ON "ActivityLog" ("userId");
CREATE INDEX "ActivityLog_workspaceId_idx" ON "ActivityLog" ("workspaceId");
CREATE INDEX "ActivityLog_createdAt_idx"   ON "ActivityLog" ("createdAt");

-- ---------------------------------------------------------------------------
-- CONTENT TEMPLATES
-- ---------------------------------------------------------------------------
CREATE TABLE "Template" (
  "id"          TEXT PRIMARY KEY,
  "slug"        TEXT NOT NULL UNIQUE,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "category"    TEXT NOT NULL,
  "prompt"      TEXT NOT NULL,
  "fields"      JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isPremium"   BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER "Template_updatedAt"
  BEFORE UPDATE ON "Template"
  FOR EACH ROW EXECUTE FUNCTION writeguard_set_updated_at();

-- ---------------------------------------------------------------------------
-- PLAGIARISM & AI DETECTION
-- ---------------------------------------------------------------------------
CREATE TABLE "PlagiarismCheck" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content"         TEXT NOT NULL,
  "similarityScore" DOUBLE PRECISION,
  "matchedSources"  JSONB,
  "highlights"      JSONB,
  "provider"        TEXT,
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "PlagiarismCheck_userId_idx" ON "PlagiarismCheck" ("userId");

CREATE TABLE "AIDetectionCheck" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content"          TEXT NOT NULL,
  "aiProbability"    DOUBLE PRECISION,
  "humanProbability" DOUBLE PRECISION,
  "mixedEstimate"    DOUBLE PRECISION,
  "highlights"       JSONB,
  "provider"         TEXT,
  "status"           TEXT NOT NULL DEFAULT 'pending',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "AIDetectionCheck_userId_idx" ON "AIDetectionCheck" ("userId");

-- ---------------------------------------------------------------------------
-- FEEDBACK
-- ---------------------------------------------------------------------------
CREATE TABLE "Feedback" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "rating"    INTEGER,
  "message"   TEXT NOT NULL,
  "page"      TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Feedback_userId_idx" ON "Feedback" ("userId");

-- =============================================================================
-- SEED DATA: Subscription Plans
-- =============================================================================
INSERT INTO "Plan" (
  "id", "tier", "name", "description",
  "priceMonthly", "priceYearly",
  "aiCreditsMonthly", "maxDocuments", "maxBrandVoices",
  "features", "isActive"
) VALUES
(
  'plan_free',
  'FREE',
  'Free',
  'Get started with essential writing checks',
  0, 0,
  50, 5, 0,
  '["Limited grammar checks","Limited AI rewrites","5 documents","Basic tone detection"]'::jsonb,
  TRUE
),
(
  'plan_pro',
  'PRO',
  'Pro',
  'For creators and professionals who write daily',
  19, 190,
  2000, -1, 5,
  '["Unlimited documents","Higher AI credits","Full sentence rewrites","Brand voice profiles","Advanced tone adjustment","Content templates","Amazon listing module"]'::jsonb,
  TRUE
),
(
  'plan_business',
  'BUSINESS',
  'Business',
  'For teams that need shared voice and style',
  49, 490,
  10000, -1, 20,
  '["Everything in Pro","Team workspace","Shared brand voice","Style guide","Admin controls","Team analytics","Higher usage limits"]'::jsonb,
  TRUE
),
(
  'plan_enterprise',
  'ENTERPRISE',
  'Enterprise',
  'Custom limits and enterprise-grade controls',
  0, 0,
  -1, -1, -1,
  '["Custom limits","Priority support","Confidential mode","DLP-ready architecture","Custom style rules","SSO (coming soon)"]'::jsonb,
  TRUE
);

-- =============================================================================
-- SEED DATA: Content Templates (15 templates)
-- =============================================================================
INSERT INTO "Template" ("id", "slug", "name", "description", "category", "prompt", "fields", "isPremium", "isActive") VALUES

('tmpl_blog_intro', 'blog-intro', 'Blog Introduction', 'Write an engaging blog post introduction', 'Blog',
 'Write a compelling blog post introduction that hooks the reader, establishes the topic, and previews what they''ll learn.',
 '[{"name":"topic","label":"Topic","type":"text","required":true},{"name":"audience","label":"Target audience","type":"text","required":false},{"name":"keyPoint","label":"Main takeaway","type":"text","required":false}]'::jsonb,
 FALSE, TRUE),

('tmpl_blog_outline', 'blog-outline', 'Blog Outline', 'Generate a structured blog post outline', 'Blog',
 'Create a detailed blog post outline with H2 and H3 headings, key points for each section, and a suggested word count per section.',
 '[{"name":"topic","label":"Topic","type":"text","required":true},{"name":"keywords","label":"SEO keywords","type":"text","required":false}]'::jsonb,
 FALSE, TRUE),

('tmpl_product_desc', 'product-description', 'Product Description', 'Write a compelling product description', 'E-commerce',
 'Write a benefit-driven product description that converts browsers into buyers. Focus on outcomes, not just features.',
 '[{"name":"productName","label":"Product name","type":"text","required":true},{"name":"features","label":"Key features","type":"textarea","required":true},{"name":"audience","label":"Target customer","type":"text","required":false}]'::jsonb,
 TRUE, TRUE),

('tmpl_amazon_title', 'amazon-title', 'Amazon Title', 'Generate an SEO-optimized Amazon product title', 'Amazon',
 'Write an Amazon product title under 200 characters. Include primary keywords naturally. Lead with brand if provided.',
 '[{"name":"productName","label":"Product name","type":"text","required":true},{"name":"brand","label":"Brand","type":"text","required":false},{"name":"keywords","label":"Main keywords","type":"text","required":true}]'::jsonb,
 TRUE, TRUE),

('tmpl_amazon_bullets', 'amazon-bullets', 'Amazon Bullet Points', 'Generate 5 benefit-driven Amazon bullet points', 'Amazon',
 'Write exactly 5 Amazon bullet points. Each bullet starts with a capitalized benefit phrase in ALL CAPS followed by a dash and supporting detail. Max 500 characters each.',
 '[{"name":"productName","label":"Product name","type":"text","required":true},{"name":"features","label":"Product features","type":"textarea","required":true}]'::jsonb,
 TRUE, TRUE),

('tmpl_linkedin', 'linkedin-post', 'LinkedIn Post', 'Create an engaging LinkedIn post', 'Social',
 'Write a LinkedIn post with a strong hook, valuable insights, and a clear call-to-action. Use short paragraphs and line breaks for readability.',
 '[{"name":"topic","label":"Topic or idea","type":"text","required":true},{"name":"goal","label":"Post goal","type":"text","required":false}]'::jsonb,
 FALSE, TRUE),

('tmpl_email_reply', 'email-reply', 'Email Reply', 'Draft a professional email reply', 'Email',
 'Write a clear, professional email reply based on the context provided. Match the appropriate tone and address all points raised.',
 '[{"name":"context","label":"Email context","type":"textarea","required":true},{"name":"keyPoints","label":"Points to address","type":"textarea","required":true}]'::jsonb,
 FALSE, TRUE),

('tmpl_cold_email', 'cold-email', 'Cold Email', 'Write a persuasive cold outreach email', 'Email',
 'Write a concise cold email with a personalized opening, clear value proposition, social proof hint, and soft CTA. Keep under 150 words.',
 '[{"name":"prospect","label":"Prospect/company","type":"text","required":true},{"name":"offer","label":"Your offer/value","type":"textarea","required":true},{"name":"personalization","label":"Personalization hook","type":"text","required":false}]'::jsonb,
 TRUE, TRUE),

('tmpl_ad_copy', 'ad-copy', 'Ad Copy', 'Generate high-converting ad copy', 'Marketing',
 'Write ad copy with a headline, primary text, and call-to-action. Focus on benefits and urgency without being pushy.',
 '[{"name":"product","label":"Product/service","type":"text","required":true},{"name":"platform","label":"Ad platform","type":"text","required":false},{"name":"audience","label":"Target audience","type":"text","required":false}]'::jsonb,
 TRUE, TRUE),

('tmpl_landing', 'landing-page-section', 'Landing Page Section', 'Write a landing page hero or section', 'Marketing',
 'Write a conversion-focused landing page section with headline, subheadline, body copy, and CTA button text.',
 '[{"name":"product","label":"Product/service","type":"text","required":true},{"name":"section","label":"Section type (hero, features, etc.)","type":"text","required":true},{"name":"benefits","label":"Key benefits","type":"textarea","required":true}]'::jsonb,
 TRUE, TRUE),

('tmpl_meta', 'meta-tags', 'Meta Title & Description', 'Generate SEO meta title and description', 'SEO',
 'Write an SEO meta title (max 60 chars) and meta description (max 155 chars). Include primary keyword naturally. Return both in the content field clearly labeled.',
 '[{"name":"pageTopic","label":"Page topic","type":"text","required":true},{"name":"keywords","label":"Primary keyword","type":"text","required":true}]'::jsonb,
 FALSE, TRUE),

('tmpl_faq', 'faq-generator', 'FAQ Generator', 'Generate FAQ questions and answers', 'Content',
 'Generate 8-10 frequently asked questions with clear, helpful answers for the given product or topic.',
 '[{"name":"topic","label":"Product or topic","type":"text","required":true},{"name":"audience","label":"Target audience","type":"text","required":false}]'::jsonb,
 FALSE, TRUE),

('tmpl_case_study', 'case-study-outline', 'Case Study Outline', 'Structure a compelling case study', 'Content',
 'Create a case study outline with sections: Challenge, Solution, Implementation, Results, and Key Takeaways. Include bullet points for each section.',
 '[{"name":"client","label":"Client/industry","type":"text","required":true},{"name":"challenge","label":"Main challenge","type":"textarea","required":true},{"name":"solution","label":"Solution provided","type":"textarea","required":true}]'::jsonb,
 TRUE, TRUE),

('tmpl_weekly', 'weekly-report', 'Weekly Report Summary', 'Summarize weekly work into a report', 'Business',
 'Write a professional weekly report summary with accomplishments, metrics, blockers, and next week''s priorities.',
 '[{"name":"accomplishments","label":"Accomplishments","type":"textarea","required":true},{"name":"metrics","label":"Key metrics","type":"textarea","required":false},{"name":"blockers","label":"Blockers","type":"textarea","required":false}]'::jsonb,
 FALSE, TRUE),

('tmpl_client_report', 'client-report', 'Client Report', 'Write a professional client status report', 'Business',
 'Write a polished client report with executive summary, progress update, deliverables completed, upcoming milestones, and recommendations.',
 '[{"name":"clientName","label":"Client name","type":"text","required":true},{"name":"project","label":"Project name","type":"text","required":true},{"name":"updates","label":"Progress updates","type":"textarea","required":true}]'::jsonb,
 TRUE, TRUE);

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (optional — run separately to confirm)
-- =============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT "tier", "name" FROM "Plan";
-- SELECT "slug", "name", "category" FROM "Template" ORDER BY "category", "name";

-- =============================================================================
-- AFTER SIGNUP: Make yourself admin
-- Replace 'your@email.com' with your actual email, then run:
-- =============================================================================
-- UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'your@email.com';
