import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logAIRequest } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { runSopReportGenerator } from "@/lib/run-sop-reports";
import {
  SOP_ATTACHMENT_LIMITS,
  totalAttachmentChars,
} from "@/lib/sop-report-attachments";
import {
  SOP_REPORT_DOCUMENT_TYPES,
  SOP_REPORT_LENGTHS,
  SOP_REPORT_TONES,
} from "@/prompts/sop-reports";

const attachmentSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().min(1).max(SOP_ATTACHMENT_LIMITS.maxContentChars),
});

const schema = z
  .object({
    documentType: z.enum(
      Object.keys(SOP_REPORT_DOCUMENT_TYPES) as [
        keyof typeof SOP_REPORT_DOCUMENT_TYPES,
        ...(keyof typeof SOP_REPORT_DOCUMENT_TYPES)[],
      ]
    ),
    title: z.string().min(1).max(200),
    topic: z.string().max(8000),
    audience: z.string().max(200).optional(),
    department: z.string().max(200).optional(),
    tone: z
      .enum(
        Object.keys(SOP_REPORT_TONES) as [
          keyof typeof SOP_REPORT_TONES,
          ...(keyof typeof SOP_REPORT_TONES)[],
        ]
      )
      .optional(),
    length: z
      .enum(
        Object.keys(SOP_REPORT_LENGTHS) as [
          keyof typeof SOP_REPORT_LENGTHS,
          ...(keyof typeof SOP_REPORT_LENGTHS)[],
        ]
      )
      .optional(),
    additionalNotes: z.string().max(4000).optional(),
    attachments: z.array(attachmentSchema).max(SOP_ATTACHMENT_LIMITS.maxCount).optional(),
  })
  .superRefine((data, ctx) => {
    const topicLen = data.topic.trim().length;
    const attachmentChars = totalAttachmentChars(data.attachments ?? []);
    if (topicLen < 10 && attachmentChars < 50) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide at least 10 characters in the topic field or upload reference attachments with enough content",
        path: ["topic"],
      });
    }
    if (attachmentChars > SOP_ATTACHMENT_LIMITS.maxTotalChars) {
      ctx.addIssue({
        code: "custom",
        message: `Attachments exceed ${SOP_ATTACHMENT_LIMITS.maxTotalChars.toLocaleString()} total characters`,
        path: ["attachments"],
      });
    }
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

  const access = await checkFeatureAccess(auth.session.user.id, "sop-reports");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    const result = await runSopReportGenerator(parsed.data);

    await logAIRequest({
      userId: auth.session.user.id,
      endpoint: "/api/tools/sop-reports",
      model: process.env.OPENAI_INTELLIGENCE_MODEL ?? process.env.OPENAI_MODEL,
      success: true,
      durationMs: Date.now() - start,
    });

    return Response.json(result);
  } catch (err) {
    console.error("SOP/Report generation error:", err);
    return apiError(
      err instanceof Error ? err.message : "Document generation failed",
      500
    );
  }
}
