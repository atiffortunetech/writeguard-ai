"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Copy } from "lucide-react";

interface Snippet {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
}

const STORAGE_KEY = "writeguard-snippets";

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [shortcut, setShortcut] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSnippets(JSON.parse(raw));
  }, []);

  const save = () => {
    const next = [
      ...snippets,
      {
        id: crypto.randomUUID(),
        title: title || "Untitled",
        content,
        shortcut: shortcut || undefined,
      },
    ];
    setSnippets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setTitle("");
    setContent("");
    setShortcut("");
  };

  const remove = (id: string) => {
    const next = snippets.filter((s) => s.id !== id);
    setSnippets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <>
      <DashboardHeader
        title="Snippets"
        description="Save and reuse text snippets across your writing"
      />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-display">New Snippet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input
                placeholder="Shortcut (optional)"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
              />
              <Textarea
                placeholder="Snippet content…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
              <Button onClick={save} disabled={!content.trim()}>
                <Plus className="h-4 w-4" /> Save Snippet
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {snippets.length === 0 ? (
              <Card className="glass-card border-0">
                <CardContent className="py-12 text-center text-sm text-slate-500">
                  No snippets yet. Create your first one.
                </CardContent>
              </Card>
            ) : (
              snippets.map((s) => (
                <Card key={s.id} className="glass-card border-0">
                  <CardContent className="flex gap-4 p-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      {s.shortcut && (
                        <p className="text-xs text-violet-500">/{s.shortcut}</p>
                      )}
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{s.content}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(s.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
