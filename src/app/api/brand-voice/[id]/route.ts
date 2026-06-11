import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { brandVoiceSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const brandVoice = await prisma.brandVoice.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!brandVoice) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(brandVoice);
  } catch (error) {
    console.error("Brand voice get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand voice" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const parsed = brandVoiceSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.brandVoice.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (parsed.data.isDefault) {
      await prisma.brandVoice.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const brandVoice = await prisma.brandVoice.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(brandVoice);
  } catch (error) {
    console.error("Brand voice update error:", error);
    return NextResponse.json(
      { error: "Failed to update brand voice" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.brandVoice.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.brandVoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand voice delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand voice" },
      { status: 500 }
    );
  }
}
