"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, MessageSquare } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/tools/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessages([...next, { role: "assistant", content: data.message }]);
    } else {
      setMessages([
        ...next,
        { role: "assistant", content: data.error || "Something went wrong." },
      ]);
    }
  };

  return (
    <>
      <DashboardHeader
        title="AI Chat"
        description="Chat with your writing assistant — brainstorm, edit, and get feedback"
      />
      <div className="flex flex-1 flex-col overflow-hidden p-6">
        <Card className="glass-card flex flex-1 flex-col border-0 overflow-hidden">
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                  <MessageSquare className="mb-4 h-12 w-12 text-violet-300" />
                  <p>Ask anything about writing, editing, or your draft.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white"
                        : "border border-violet-100 bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border bg-white px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-violet-100 p-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message…"
                  rows={2}
                  className="min-h-0 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <Button onClick={send} disabled={loading || !input.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
