"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Send } from "lucide-react";
import { AGENT_PROMPTS } from "@/prompts/tools";

const AGENTS = Object.entries(AGENT_PROMPTS).map(([id, description]) => ({
  id,
  name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  description,
}));

export default function AiAgentsPage() {
  const [selected, setSelected] = useState(AGENTS[0].id);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReply(null);
    const res = await fetch("/api/tools/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: selected,
        messages: [{ role: "user", content: input }],
      }),
    });
    const data = await res.json();
    setLoading(false);
    setReply(res.ok ? data.message : data.error);
  };

  return (
    <>
      <DashboardHeader
        title="AI Agents"
        description="Specialized writing assistants for every task"
      />
      <div className="dashboard-content">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelected(agent.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selected === agent.id
                    ? "border-violet-400 bg-violet-50/80 shadow-md"
                    : "border-violet-100 bg-white hover:border-violet-200"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-violet-500" />
                  <span className="font-semibold text-slate-900">{agent.name}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{agent.description}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  {AGENTS.find((a) => a.id === selected)?.name}
                  <Badge>Agent</Badge>
                </CardTitle>
                <CardDescription>
                  {AGENTS.find((a) => a.id === selected)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={5}
                  placeholder="Ask your agent…"
                />
                <Button onClick={ask} disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ask Agent
                </Button>
                {reply && (
                  <div className="whitespace-pre-wrap rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-sm">
                    {reply}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
