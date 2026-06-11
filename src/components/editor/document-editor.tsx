"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { calculateReadingTime } from "@/lib/utils";

interface DocumentEditorProps {
  initialContent?: string;
  onUpdate?: (html: string, plainText: string) => void;
}

export function DocumentEditor({ initialContent = "", onUpdate }: DocumentEditorProps) {
  const setContent = useEditorStore((s) => s.setContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing, or paste your content here...",
      }),
      CharacterCount,
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[500px] focus:outline-none px-6 py-4 text-slate-800",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const plainText = ed.getText();
      setContent(html, plainText);
      onUpdate?.(html, plainText);
    },
  });

  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  const wordCount = editor?.storage.characterCount?.words?.() ?? 0;
  const charCount = editor?.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
        <span>{calculateReadingTime(wordCount)}</span>
      </div>
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}
