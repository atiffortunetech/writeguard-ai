import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { contentGenerateSchema } from "@/lib/validations";
import { getAIProvider, isAIConfigured } from "@/providers/ai";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  if (!isAIConfigured()) return apiError("AI provider not configured", 503);

  const access = await checkFeatureAccess(auth.session.user.id, "templates");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const { slug } = await ctx.params;
  const template = await prisma.template.findUnique({ where: { slug } });
  if (!template) return apiError("Template not found", 404);

  const body = await req.json();
  const parsed = contentGenerateSchema.safeParse({ ...body, templateSlug: slug });
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  let brandVoice;
  if (parsed.data.brandVoiceId) {
    brandVoice = await prisma.brandVoice.findFirst({
      where: { id: parsed.data.brandVoiceId, userId: auth.session.user.id },
    });
  }

  const provider = getAIProvider();
  const result = await provider.generateContent(
    template.prompt,
    parsed.data.inputs,
    parsed.data.tone ?? undefined,
    brandVoice ?? undefined
  );

  await logAIRequest({
    userId: auth.session.user.id,
    endpoint: `/api/templates/${slug}/generate`,
    model: process.env.OPENAI_MODEL,
    success: true,
    durationMs: Date.now() - start,
  });

  return Response.json({ ...result, templateName: template.name });
}
