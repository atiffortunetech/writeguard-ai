import { NextRequest } from "next/server";
import {
  createPlagiarismCheck,
  listPlagiarismChecksByUserId,
} from "@/lib/db";
import { plagiarismSchema } from "@/lib/validations";
import { getPlagiarismProvider } from "@/providers/plagiarism";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkUsageLimit, logUsage } from "@/lib/usage";
import { checkFeatureAccess } from "@/lib/plan-features";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const usage = await checkUsageLimit(auth.session.user.id, "ai_request");
  if (!usage.allowed) return apiError(usage.reason ?? "Limit reached", 403);

  const access = await checkFeatureAccess(auth.session.user.id, "plagiarism");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = plagiarismSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const provider = getPlagiarismProvider();

  if (!provider.isConfigured()) {
    return Response.json({
      configured: false,
      message: "Plagiarism provider not configured. Connect Copyleaks or another provider to enable checks.",
      provider: provider.name,
    });
  }

  try {
    const result = await provider.checkPlagiarism(parsed.data.text);

    const check = await createPlagiarismCheck({
      userId: auth.session.user.id,
      content: parsed.data.text.slice(0, 10000),
      similarityScore: result.similarityScore,
      matchedSources: result.matchedSources,
      highlights: result.highlights,
      provider: result.provider,
      status: "completed",
    });

    await logUsage(auth.session.user.id, "plagiarism_check");
    await logActivity({
      userId: auth.session.user.id,
      type: "PLAGIARISM_CHECK",
      description: "Plagiarism check completed",
    });

    return Response.json({ configured: true, checkId: check.id, ...result });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "Plagiarism check failed",
      503
    );
  }
}

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const checks = await listPlagiarismChecksByUserId(auth.session.user.id, {
    limit: 20,
  });

  const provider = getPlagiarismProvider();
  return Response.json({ checks, providerConfigured: provider.isConfigured() });
}
