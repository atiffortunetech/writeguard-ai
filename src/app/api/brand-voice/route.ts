import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { brandVoiceSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { getUserPlanTier } from "@/lib/usage";
import { PLAN_DEFINITIONS } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandVoices = await prisma.brandVoice.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

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
      const count = await prisma.brandVoice.count({
        where: { userId: session.user.id },
      });
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
      await prisma.brandVoice.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const brandVoice = await prisma.brandVoice.create({
      data: {
        ...data,
        userId: session.user.id,
      },
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
