import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { documentSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const document = await prisma.document.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Document get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
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
    const parsed = documentSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.document.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plainText = parsed.data.plainText ?? parsed.data.content ?? existing.plainText;
    const wordCount = countWords(plainText);

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...parsed.data,
        plainText,
        wordCount,
        characterCount: plainText.length,
      },
    });

    const versionCount = await prisma.documentVersion.count({
      where: { documentId: id },
    });

    await prisma.documentVersion.create({
      data: {
        documentId: id,
        userId: session.user.id,
        content: document.content,
        plainText: document.plainText,
        version: versionCount + 1,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Document update error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
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

    const existing = await prisma.document.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
