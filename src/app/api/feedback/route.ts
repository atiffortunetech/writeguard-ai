import { NextRequest } from "next/server";
import { createFeedback } from "@/lib/db";
import { feedbackSchema } from "@/lib/validations";
import { requireApiAuth, apiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const feedback = await createFeedback({
    userId: auth.session.user.id,
    message: parsed.data.message,
    rating: parsed.data.rating,
    page: parsed.data.page,
  });

  return Response.json(feedback, { status: 201 });
}
