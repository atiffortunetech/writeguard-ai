import { NextRequest } from "next/server";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkFeatureAccess } from "@/lib/plan-features";
import { aiRateLimiter, checkRateLimit } from "@/lib/redis";
import { isAIConfigured } from "@/providers/ai";
import { logAIRequest } from "@/lib/usage";
import {
  attachmentUsesVision,
  extractAttachmentFromBuffer,
  isAllowedAttachment,
} from "@/lib/extract-sop-attachment-server";
import { SOP_ATTACHMENT_LIMITS } from "@/lib/sop-report-attachments";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const rate = await checkRateLimit(auth.session.user.id, aiRateLimiter);
  if (!rate.success) return apiError("Rate limit exceeded", 429);

  const access = await checkFeatureAccess(auth.session.user.id, "sop-reports");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError("No file uploaded", 400);
  }

  if (file.size > SOP_ATTACHMENT_LIMITS.maxFileBytes) {
    return apiError(`${file.name} exceeds 2 MB limit`, 400);
  }

  if (!isAllowedAttachment(file.name, file.type)) {
    return apiError(
      `${file.name}: unsupported type. Use PDF, Word, Excel, text, or PNG/JPEG`,
      400
    );
  }

  if (attachmentUsesVision(file.name, file.type) && !isAIConfigured()) {
    return apiError("AI provider not configured (required for image attachments)", 503);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractAttachmentFromBuffer(buffer, file.name, file.type);

    if (attachmentUsesVision(file.name, file.type)) {
      await logAIRequest({
        userId: auth.session.user.id,
        endpoint: "/api/tools/sop-reports/extract-attachment",
        model: process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL,
        success: true,
        durationMs: Date.now() - start,
      });
    }

    return Response.json({
      name: file.name,
      content,
      size: file.size,
    });
  } catch (err) {
    console.error("SOP attachment extract error:", err);
    return apiError(
      err instanceof Error ? err.message : "Could not read attachment",
      500
    );
  }
}
