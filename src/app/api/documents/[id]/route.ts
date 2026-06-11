import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { documentSchema } from "@/lib/validations";
import {
  countVersions,
  createVersion,
  deleteDocument,
  findDocumentByIdAndUserId,
  updateDocument,
} from "@/lib/db";
import { countWords } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const document = await findDocumentByIdAndUserId(id, session.user.id);

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

    const existing = await findDocumentByIdAndUserId(id, session.user.id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plainText = parsed.data.plainText ?? parsed.data.content ?? existing.plainText;
    const wordCount = countWords(plainText);

    const document = await updateDocument(id, {
      ...parsed.data,
      plainText,
      wordCount,
      characterCount: plainText.length,
    });

    const versionCount = await countVersions(id);

    await createVersion({
      documentId: id,
      userId: session.user.id,
      content: document.content,
      plainText: document.plainText,
      version: versionCount + 1,
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

    const existing = await findDocumentByIdAndUserId(id, session.user.id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteDocument(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
