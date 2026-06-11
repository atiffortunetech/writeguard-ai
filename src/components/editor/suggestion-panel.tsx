"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/stores/editor-store";
import { Check, X } from "lucide-react";

const severityVariant = {
  low: "secondary" as const,
  medium: "warning" as const,
  high: "destructive" as const,
};

export function SuggestionPanel() {
  const {
    suggestions,
    dismissedSuggestionIds,
    dismissSuggestion,
    acceptSuggestion,
    filterSuggestions,
  } = useEditorStore();

  const [filter, setFilter] = useState("all");
  const visible = filterSuggestions(filter === "all" ? undefined : filter);

  const types = [...new Set(suggestions.map((s) => s.type))];

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">No suggestions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({suggestions.length - dismissedSuggestionIds.size})
        </Button>
        {types.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={filter === type ? "default" : "outline"}
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <Badge variant={severityVariant[suggestion.severity]}>
                {suggestion.type}
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-emerald-600"
                  onClick={() => acceptSuggestion(suggestion.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-400"
                  onClick={() => dismissSuggestion(suggestion.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mb-2 text-sm text-slate-500 line-through">
              {suggestion.originalText}
            </p>
            <p className="mb-2 text-sm font-medium text-slate-900">
              {suggestion.suggestedText}
            </p>
            <p className="text-xs text-slate-500">{suggestion.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
