import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { brandVoiceSchema } from "@/lib/validations";
import {
  clearDefaultBrandVoices,
  countBrandVoicesByUserId,
  createBrandVoice,
  listBrandVoicesByUserId,
} from "@/lib/db";
import { getUserPlanTier } from "@/lib/usage";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandVoices = await listBrandVoicesByUserId(session.user.id);

    return NextResponse.json(brandVoices);
  } catch (error) {
    console.error("Brand voice list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand voices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getUserPlanTier(session.user.id);
    const limits = PLAN_DEFINITIONS[tier];

    if (limits.maxBrandVoices === 0) {
      return NextResponse.json(
        { error: "Brand voice is a Pro feature. Upgrade your plan." },
        { status: 403 }
      );
    }

    if (limits.maxBrandVoices > 0) {
      const count = await countBrandVoicesByUserId(session.user.id);
      if (count >= limits.maxBrandVoices) {
        return NextResponse.json(
          { error: `Brand voice limit reached (${limits.maxBrandVoices}).` },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const parsed = brandVoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.isDefault) {
      await clearDefaultBrandVoices(session.user.id);
    }

    const brandVoice = await createBrandVoice({
      name: data.name,
      brandName: data.brandName ?? null,
      targetAudience: data.targetAudience ?? null,
      tone: data.tone ?? null,
      wordsToUse: data.wordsToUse,
      wordsToAvoid: data.wordsToAvoid,
      writingStyle: data.writingStyle ?? null,
      exampleContent: data.exampleContent ?? null,
      personality: data.personality ?? null,
      industry: data.industry ?? null,
      contentGoals: data.contentGoals ?? null,
      workspaceId: data.workspaceId ?? null,
      isDefault: data.isDefault,
      userId: session.user.id,
    });

    return NextResponse.json(brandVoice, { status: 201 });
  } catch (error) {
    console.error("Brand voice create error:", error);
    return NextResponse.json(
      { error: "Failed to create brand voice" },
      { status: 500 }
    );
  }
}
