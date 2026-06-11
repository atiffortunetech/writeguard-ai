import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { documentSchema } from "@/lib/validations";
import { createDocument, createVersion, findDocuments } from "@/lib/db";
import { checkUsageLimit } from "@/lib/usage";
import { countWords } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await findDocuments(session.user.id, { limit: 50 });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Documents list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    const usageCheck = await checkUsageLimit(session.user.id, "document");
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 403 });
    }

    const body = await req.json();
    const parsed = documentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, content, plainText, brandVoiceId, styleGuideId, workspaceId, isConfidential } =
      parsed.data;

    const wordCount = countWords(plainText || content);

    const document = await createDocument({
      title,
      content,
      plainText: plainText || content,
      userId: session.user.id,
      brandVoiceId,
      styleGuideId,
      workspaceId,
      isConfidential,
      wordCount,
      characterCount: (plainText || content).length,
    });

    await createVersion({
      documentId: document.id,
      userId: session.user.id,
      content: document.content,
      plainText: document.plainText,
      version: 1,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document create error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
