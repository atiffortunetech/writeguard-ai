import { NextRequest } from "next/server";
import { createStyleGuide, listStyleGuidesByUserId } from "@/lib/db";
import { styleGuideSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";
import { checkFeatureAccess } from "@/lib/plan-features";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const access = await checkFeatureAccess(auth.session.user.id, "style-guide");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const guides = await listStyleGuidesByUserId(auth.session.user.id);
  return Response.json(guides);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const access = await checkFeatureAccess(auth.session.user.id, "style-guide");
  if (!access.allowed) return apiError(access.reason ?? "Upgrade required", 403);

  const body = await req.json();
  const parsed = styleGuideSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const guide = await createStyleGuide({
    ...parsed.data,
    userId: auth.session.user.id,
  });
  return Response.json(guide, { status: 201 });
}
