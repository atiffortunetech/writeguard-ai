import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { runTranslator } from "@/lib/run-translator";
import { SOURCE_LANGUAGE_CODES, TARGET_LANGUAGE_CODES } from "@/lib/languages";

const TARGET_CODES = TARGET_LANGUAGE_CODES as unknown as readonly [string, ...string[]];

const schema = z.object({
  text: z.string().min(1).max(50000),
  html: z.string().max(200000).optional(),
  sourceLanguage: z.enum(SOURCE_LANGUAGE_CODES),
  targetLanguage: z.enum(TARGET_CODES),
  formality: z.enum(["neutral", "formal", "casual"]).default("neutral"),
  domain: z
    .enum(["general", "business", "legal", "medical", "marketing", "technical", "academic"])
    .default("general"),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  if (!isAIConfigured()) return apiError("AI provider not configured", 503);

  const access = await checkFeatureAccess(auth.session.user.id, "translator");
  if (!access.allowed) {
    return apiError(access.reason ?? "Upgrade required", 403);
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  if (
    parsed.data.sourceLanguage !== "auto" &&
    parsed.data.sourceLanguage === parsed.data.targetLanguage
  ) {
    return apiError("Source and target language must be different", 400);
  }

  try {
    const result = await runTranslator(
      parsed.data.text,
      parsed.data.sourceLanguage,
      parsed.data.targetLanguage,
      {
        formality: parsed.data.formality,
        domain: parsed.data.domain,
        html: parsed.data.html,
      }
    );

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/tools/translate",
      model: process.env.OPENAI_TRANSLATOR_MODEL || process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json(result);
  } catch (err) {
    console.error("Translator error:", err);
    return apiError(err instanceof Error ? err.message : "Translation failed", 500);
  }
}
