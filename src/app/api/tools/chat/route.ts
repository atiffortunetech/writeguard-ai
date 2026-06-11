import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { runChatMessage } from "@/lib/run-writing-tool";

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(10000),
    })
  ),
  agentId: z.string().optional(),
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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const featureId = parsed.data.agentId ? "ai-agents" : "ai-chat";
  const access = await checkFeatureAccess(auth.session.user.id, featureId);
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  try {
    const reply = await runChatMessage(parsed.data.messages, parsed.data.agentId);

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/tools/chat",
      model: process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json({ message: reply });
  } catch (err) {
    console.error("Chat error:", err);
    return apiError(err instanceof Error ? err.message : "Chat failed", 500);
  }
}
