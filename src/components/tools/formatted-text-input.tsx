"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface FormattedTextValue {
  html: string;
  plainText: string;
}

interface FormattedTextInputProps {
  onChange: (value: FormattedTextValue) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function FormattedTextInput({
  onChange,
  placeholder = "Paste from Google Docs, Word, or type here — headings, bold, and paragraphs are preserved…",
  className,
  minHeight = "280px",
}: FormattedTextInputProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      transformPastedHTML(html) {
        return html
          .replace(
            /<span[^>]*style="[^"]*font-weight:\s*(?:bold|[67]00)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
            "<strong>$1</strong>"
          )
          .replace(/<b\b([^>]*)>/gi, "<strong$1>")
          .replace(/<\/b>/gi, "</strong>");
      },
      attributes: {
        class: cn(
          "formatted-tool-prose prose prose-slate max-w-none focus:outline-none px-4 py-3 text-slate-900",
          className
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange({
        html: ed.getHTML(),
        plainText: ed.getText(),
      });
    },
  });

  useEffect(() => {
    if (editor) {
      onChange({
        html: editor.getHTML(),
        plainText: editor.getText(),
      });
    }
  }, [editor, onChange]);

  return (
    <div className="formatted-tool-editor overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
      <div className="border-b border-violet-50 bg-violet-50/40 px-3 py-1.5 text-[10px] font-medium text-violet-600">
        Rich paste — H1–H6, bold, paragraphs & links preserved
      </div>
      <EditorContent editor={editor} className="max-h-[min(60vh,520px)] overflow-y-auto" />
    </div>
  );
}
