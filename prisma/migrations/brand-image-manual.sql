-- Brand Image Studio table (run in Supabase SQL Editor if prisma db push hangs)

CREATE TABLE IF NOT EXISTS "BrandImage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'prompt',
  "sourceText" TEXT,
  "imagePrompt" TEXT NOT NULL,
  "colors" JSONB NOT NULL DEFAULT '{}',
  "stylePreset" TEXT NOT NULL DEFAULT 'social-banner',
  "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
  "imageUrl" TEXT NOT NULL,
  "storagePath" TEXT,
  "mimeType" TEXT NOT NULL DEFAULT 'image/png',
  "brandVoiceId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'gemini',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "referenceImageUrl" TEXT,
  "referenceStoragePath" TEXT,
  CONSTRAINT "BrandImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BrandImage_userId_idx" ON "BrandImage"("userId");
CREATE INDEX IF NOT EXISTS "BrandImage_createdAt_idx" ON "BrandImage"("createdAt");

DO $$ BEGIN
  ALTER TABLE "BrandImage" ADD CONSTRAINT "BrandImage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add enum value for activity log (if using PostgreSQL enum for ActivityType)
-- ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BRAND_IMAGE_GENERATED';
