import { NextRequest } from "next/server";
import { createTemplate, listTemplates } from "@/lib/db";
import { requireApiAuth } from "@/lib/api-utils";
import { getUserPlanTier } from "@/lib/usage";

export async function GET() {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const tier = await getUserPlanTier(auth.session.user.id);
  const templates = await listTemplates({ activeOnly: true });

  const filtered = templates.filter((t) => !t.isPremium || tier !== "FREE");
  return Response.json(filtered);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  if (auth.session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const template = await createTemplate(body);
  return Response.json(template, { status: 201 });
}
