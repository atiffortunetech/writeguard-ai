import { DashboardHeader } from "@/components/dashboard/header";
import { EditorWorkspace } from "@/components/editor/editor-workspace";

export default function NewEditorPage() {
  return (
    <>
      <DashboardHeader title="Editor" description="Write and improve your content with AI" />
      <div className="flex-1 overflow-hidden">
        <EditorWorkspace />
      </div>
    </>
  );
}
