import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/header";
import { EditorWorkspace } from "@/components/editor/editor-workspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditorPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, userId: session!.user!.id },
  });

  if (!document) notFound();

  return (
    <>
      <DashboardHeader title="Editor" description={document.title} />
      <div className="flex-1 overflow-hidden">
        <EditorWorkspace
          documentId={document.id}
          initialTitle={document.title}
          initialContent={document.content}
        />
      </div>
    </>
  );
}
