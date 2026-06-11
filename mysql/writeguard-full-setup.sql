-- WriteGuard AI — full MySQL schema
--
-- HOSTINGER / phpMyAdmin:
--   1. Click your database in the left sidebar (e.g. u998538981_writeguard)
--   2. Open Import → choose this file → Go
--   Do NOT run CREATE DATABASE — Hostinger already created your database.
--
-- Local MySQL: create a database first, select it, then import this file.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS suggestions;
DROP TABLE IF EXISTS document_versions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS brand_images;
DROP TABLE IF EXISTS plagiarism_checks;
DROP TABLE IF EXISTS ai_detection_checks;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS usage_logs;
DROP TABLE IF EXISTS ai_request_logs;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS team_invites;
DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS brand_voices;
DROP TABLE IF EXISTS style_guides;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Enums (MySQL ENUM columns)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  name            VARCHAR(255) NULL,
  email           VARCHAR(255) NOT NULL,
  email_verified  DATETIME(3)  NULL,
  image           TEXT         NULL,
  password_hash   VARCHAR(255) NULL,
  role            ENUM('USER', 'TEAM_ADMIN', 'ADMIN') NOT NULL DEFAULT 'USER',
  banned          TINYINT(1)   NOT NULL DEFAULT 0,
  suspended_at    DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accounts (
  id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id             VARCHAR(36)  NOT NULL,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token       TEXT         NULL,
  access_token        TEXT         NULL,
  expires_at          INT          NULL,
  token_type          VARCHAR(255) NULL,
  scope               VARCHAR(255) NULL,
  id_token            TEXT         NULL,
  session_state       VARCHAR(255) NULL,
  UNIQUE KEY uq_accounts_provider (provider, provider_account_id),
  KEY idx_accounts_user_id (user_id),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  session_token VARCHAR(255) NOT NULL,
  user_id       VARCHAR(36)  NOT NULL,
  expires       DATETIME(3)  NOT NULL,
  UNIQUE KEY uq_sessions_token (session_token),
  KEY idx_sessions_user_id (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires    DATETIME(3)  NOT NULL,
  PRIMARY KEY (identifier, token),
  UNIQUE KEY uq_verification_tokens_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspaces (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(255) NOT NULL,
  owner_id   VARCHAR(36)  NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_workspaces_slug (slug),
  KEY idx_workspaces_owner_id (owner_id),
  KEY idx_workspaces_slug (slug),
  CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE folders (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  user_id      VARCHAR(36)  NOT NULL,
  workspace_id VARCHAR(36)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_folders_user_id (user_id),
  KEY idx_folders_workspace_id (workspace_id),
  CONSTRAINT fk_folders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_folders_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE team_invites (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  workspace_id  VARCHAR(36)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  role          ENUM('OWNER', 'ADMIN', 'EDITOR', 'VIEWER') NOT NULL DEFAULT 'EDITOR',
  token         VARCHAR(255) NOT NULL,
  invited_by_id VARCHAR(36)  NOT NULL,
  expires_at    DATETIME(3)  NOT NULL,
  accepted_at   DATETIME(3)  NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_team_invites_workspace_email (workspace_id, email),
  UNIQUE KEY uq_team_invites_token (token),
  KEY idx_team_invites_token (token),
  KEY idx_team_invites_workspace_id (workspace_id),
  CONSTRAINT fk_team_invites_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_invites_invited_by FOREIGN KEY (invited_by_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspace_members (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  user_id      VARCHAR(36)  NOT NULL,
  role         ENUM('OWNER', 'ADMIN', 'EDITOR', 'VIEWER') NOT NULL DEFAULT 'EDITOR',
  invited_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  joined_at    DATETIME(3)  NULL,
  UNIQUE KEY uq_workspace_members_workspace_user (workspace_id, user_id),
  KEY idx_workspace_members_user_id (user_id),
  KEY idx_workspace_members_workspace_id (workspace_id),
  CONSTRAINT fk_workspace_members_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brand_voices (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  brand_name      VARCHAR(255) NULL,
  target_audience TEXT         NULL,
  tone            VARCHAR(255) NULL,
  words_to_use    JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  words_to_avoid  JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  writing_style   TEXT         NULL,
  example_content TEXT         NULL,
  personality     TEXT         NULL,
  industry        VARCHAR(255) NULL,
  content_goals   TEXT         NULL,
  user_id         VARCHAR(36)  NOT NULL,
  workspace_id    VARCHAR(36)  NULL,
  is_default      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_brand_voices_user_id (user_id),
  KEY idx_brand_voices_workspace_id (workspace_id),
  CONSTRAINT fk_brand_voices_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_brand_voices_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE style_guides (
  id                    VARCHAR(36)  NOT NULL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL DEFAULT 'Default Style Guide',
  english_variant       ENUM('US', 'UK') NOT NULL DEFAULT 'US',
  forbidden_words       JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  preferred_words       JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  capitalization_rules  TEXT         NULL,
  tone_rules            TEXT         NULL,
  sentence_length_pref  VARCHAR(255) NULL,
  reading_level         VARCHAR(255) NULL,
  compliance_rules      TEXT         NULL,
  industry_rules        TEXT         NULL,
  user_id               VARCHAR(36)  NOT NULL,
  workspace_id          VARCHAR(36)  NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_style_guides_user_id (user_id),
  KEY idx_style_guides_workspace_id (workspace_id),
  CONSTRAINT fk_style_guides_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_style_guides_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documents (
  id               VARCHAR(36)  NOT NULL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL DEFAULT 'Untitled Document',
  content          LONGTEXT     NOT NULL,
  plain_text       LONGTEXT     NOT NULL,
  user_id          VARCHAR(36)  NOT NULL,
  workspace_id     VARCHAR(36)  NULL,
  folder_id        VARCHAR(36)  NULL,
  brand_voice_id   VARCHAR(36)  NULL,
  style_guide_id   VARCHAR(36)  NULL,
  is_confidential  TINYINT(1)   NOT NULL DEFAULT 0,
  word_count       INT          NOT NULL DEFAULT 0,
  character_count  INT          NOT NULL DEFAULT 0,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_documents_user_id (user_id),
  KEY idx_documents_workspace_id (workspace_id),
  KEY idx_documents_folder_id (folder_id),
  KEY idx_documents_updated_at (updated_at),
  CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_folder FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_brand_voice FOREIGN KEY (brand_voice_id) REFERENCES brand_voices (id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_style_guide FOREIGN KEY (style_guide_id) REFERENCES style_guides (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_versions (
  id          VARCHAR(36) NOT NULL PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  content     LONGTEXT    NOT NULL,
  plain_text  LONGTEXT    NOT NULL,
  version     INT         NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_document_versions_document_id (document_id),
  CONSTRAINT fk_document_versions_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
  CONSTRAINT fk_document_versions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suggestions (
  id             VARCHAR(36) NOT NULL PRIMARY KEY,
  document_id    VARCHAR(36) NOT NULL,
  type           ENUM('GRAMMAR', 'SPELLING', 'CLARITY', 'TONE', 'CONCISENESS', 'REWRITE', 'BRAND_VOICE', 'READABILITY', 'PUNCTUATION') NOT NULL,
  severity       ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
  original_text  TEXT        NOT NULL,
  suggested_text TEXT        NOT NULL,
  explanation    TEXT        NOT NULL,
  start_index    INT         NOT NULL,
  end_index      INT         NOT NULL,
  accepted         TINYINT(1)  NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_suggestions_document_id (document_id),
  CONSTRAINT fk_suggestions_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plans (
  id                      VARCHAR(36)  NOT NULL PRIMARY KEY,
  tier                    ENUM('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE') NOT NULL,
  name                    VARCHAR(255) NOT NULL,
  description             TEXT         NULL,
  price_monthly           INT          NOT NULL DEFAULT 0,
  price_yearly            INT          NOT NULL DEFAULT 0,
  stripe_price_id_monthly VARCHAR(255) NULL,
  stripe_price_id_yearly  VARCHAR(255) NULL,
  ai_credits_monthly      INT          NOT NULL DEFAULT 50,
  max_documents           INT          NOT NULL DEFAULT 5,
  max_brand_voices        INT          NOT NULL DEFAULT 1,
  features                JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  is_active               TINYINT(1)   NOT NULL DEFAULT 1,
  created_at              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_plans_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscriptions (
  id                     VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id                VARCHAR(36) NOT NULL,
  plan_id                VARCHAR(36) NOT NULL,
  stripe_customer_id     VARCHAR(255) NULL,
  stripe_subscription_id VARCHAR(255) NULL,
  status                 ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE') NOT NULL DEFAULT 'ACTIVE',
  current_period_start   DATETIME(3) NULL,
  current_period_end     DATETIME(3) NULL,
  cancel_at_period_end   TINYINT(1)  NOT NULL DEFAULT 0,
  created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_subscriptions_stripe_subscription_id (stripe_subscription_id),
  KEY idx_subscriptions_user_id (user_id),
  KEY idx_subscriptions_stripe_customer_id (stripe_customer_id),
  KEY idx_subscriptions_plan_id (plan_id),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
  id                VARCHAR(36)  NOT NULL PRIMARY KEY,
  subscription_id   VARCHAR(36)  NOT NULL,
  stripe_invoice_id VARCHAR(255) NULL,
  amount            INT          NOT NULL,
  currency          VARCHAR(10)  NOT NULL DEFAULT 'usd',
  status            VARCHAR(50)  NOT NULL,
  paid_at           DATETIME(3)  NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_invoices_stripe_invoice_id (stripe_invoice_id),
  KEY idx_invoices_subscription_id (subscription_id),
  CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_request_logs (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id       VARCHAR(36)  NOT NULL,
  endpoint      VARCHAR(255) NOT NULL,
  model         VARCHAR(255) NULL,
  tokens_used   INT          NOT NULL DEFAULT 0,
  prompt_tokens INT          NOT NULL DEFAULT 0,
  success       TINYINT(1)   NOT NULL DEFAULT 1,
  error_message TEXT         NULL,
  duration_ms   INT          NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_ai_request_logs_user_id (user_id),
  KEY idx_ai_request_logs_created_at (created_at),
  CONSTRAINT fk_ai_request_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usage_logs (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  action     VARCHAR(255) NOT NULL,
  quantity   INT          NOT NULL DEFAULT 1,
  metadata   JSON         NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_usage_logs_user_id (user_id),
  KEY idx_usage_logs_action (action),
  KEY idx_usage_logs_created_at (created_at),
  CONSTRAINT fk_usage_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE templates (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  slug        VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  category    VARCHAR(255) NOT NULL,
  prompt      TEXT         NOT NULL,
  fields      JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  is_premium  TINYINT(1)   NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_templates_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plagiarism_checks (
  id               VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id          VARCHAR(36) NOT NULL,
  content          LONGTEXT    NOT NULL,
  similarity_score DOUBLE      NULL,
  matched_sources  JSON        NULL,
  highlights       JSON        NULL,
  provider         VARCHAR(255) NULL,
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_plagiarism_checks_user_id (user_id),
  CONSTRAINT fk_plagiarism_checks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_detection_checks (
  id                VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id           VARCHAR(36) NOT NULL,
  content           LONGTEXT    NOT NULL,
  ai_probability    DOUBLE      NULL,
  human_probability DOUBLE      NULL,
  mixed_estimate    DOUBLE      NULL,
  highlights        JSON        NULL,
  provider          VARCHAR(255) NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_ai_detection_checks_user_id (user_id),
  CONSTRAINT fk_ai_detection_checks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
  id           VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  workspace_id VARCHAR(36) NULL,
  type         ENUM(
    'DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED',
    'BRAND_VOICE_CREATED', 'BRAND_VOICE_UPDATED', 'STYLE_GUIDE_UPDATED',
    'TEAM_MEMBER_INVITED', 'TEAM_MEMBER_REMOVED', 'SUBSCRIPTION_CHANGED',
    'AI_REQUEST', 'PLAGIARISM_CHECK', 'AI_DETECTION_CHECK', 'BRAND_IMAGE_GENERATED'
  ) NOT NULL,
  description  VARCHAR(500) NOT NULL,
  metadata     JSON         NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_activity_logs_user_id (user_id),
  KEY idx_activity_logs_workspace_id (workspace_id),
  KEY idx_activity_logs_created_at (created_at),
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_logs_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  rating     INT         NULL,
  message    TEXT        NOT NULL,
  page       VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_feedback_user_id (user_id),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brand_images (
  id                     VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id                VARCHAR(36) NOT NULL,
  title                  VARCHAR(255) NULL,
  source_type            VARCHAR(50) NOT NULL DEFAULT 'prompt',
  source_text            TEXT        NULL,
  image_prompt           TEXT        NOT NULL,
  colors                 JSON        NOT NULL DEFAULT (JSON_OBJECT()),
  style_preset           VARCHAR(100) NOT NULL DEFAULT 'social-banner',
  aspect_ratio           VARCHAR(20)  NOT NULL DEFAULT '16:9',
  image_url              TEXT        NOT NULL,
  storage_path           VARCHAR(500) NULL,
  reference_image_url    TEXT        NULL,
  reference_storage_path VARCHAR(500) NULL,
  mime_type              VARCHAR(100) NOT NULL DEFAULT 'image/png',
  brand_voice_id         VARCHAR(36)  NULL,
  provider               VARCHAR(50)  NOT NULL DEFAULT 'openai',
  created_at             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_brand_images_user_id (user_id),
  KEY idx_brand_images_created_at (created_at),
  CONSTRAINT fk_brand_images_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Seed plans (matches src/lib/stripe.ts PLAN_DEFINITIONS)
-- ---------------------------------------------------------------------------

INSERT INTO plans (
  id, tier, name, description, price_monthly, price_yearly,
  ai_credits_monthly, max_documents, max_brand_voices, features, is_active
) VALUES
(
  'a0000001-0000-4000-8000-000000000001',
  'FREE',
  'Free',
  'Get started with essential writing checks',
  0, 0, 50, 5, 0,
  JSON_ARRAY(
    'Grammar & spell checker',
    'Tone detector',
    'Word / character / sentence counters',
    '5 documents',
    '50 AI credits / month',
    'Basic editor'
  ),
  1
),
(
  'a0000001-0000-4000-8000-000000000002',
  'PRO',
  'Pro',
  'For creators and professionals who write daily',
  19, 190, 2000, -1, 5,
  JSON_ARRAY(
    'Everything in Free',
    'Unlimited documents',
    '2,000 AI credits / month',
    'Proofreader, paraphrase, Smart Rewrite, humanizer',
    'Plagiarism & AI detector',
    'Essay & citation tools',
    'AI chat & AI agents',
    'Brand voice & templates',
    'Amazon listing optimizer',
    'Resume builder & snippets',
    'Brand Image Studio (OpenAI)'
  ),
  1
),
(
  'a0000001-0000-4000-8000-000000000003',
  'BUSINESS',
  'Business',
  'For teams that need shared voice and style',
  49, 490, 10000, -1, 20,
  JSON_ARRAY(
    'Everything in Pro',
    '10,000 AI credits / month',
    'Team workspace',
    'Style guide',
    'Writing analytics',
    'Authorship analysis',
    'AI grader & reader reactions',
    '20 brand voice profiles'
  ),
  1
),
(
  'a0000001-0000-4000-8000-000000000004',
  'ENTERPRISE',
  'Enterprise',
  'Custom limits and enterprise-grade controls',
  0, 0, -1, -1, -1,
  JSON_ARRAY(
    'Everything in Business',
    'Unlimited AI credits',
    'Unlimited brand voices',
    'Priority support',
    'Custom limits & SSO (coming soon)'
  ),
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price_monthly = VALUES(price_monthly),
  price_yearly = VALUES(price_yearly),
  ai_credits_monthly = VALUES(ai_credits_monthly),
  max_documents = VALUES(max_documents),
  max_brand_voices = VALUES(max_brand_voices),
  features = VALUES(features),
  is_active = VALUES(is_active);
