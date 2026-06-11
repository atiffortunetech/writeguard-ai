import { create } from "zustand";
import type { AnalysisResult, AISuggestion } from "@/types/ai";

interface EditorState {
  documentId: string | null;
  title: string;
  content: string;
  plainText: string;
  isSaving: boolean;
  isAnalyzing: boolean;
  isRewriting: boolean;
  analysis: AnalysisResult | null;
  suggestions: AISuggestion[];
  dismissedSuggestionIds: Set<string>;
  selectedBrandVoiceId: string | null;
  setDocumentId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setContent: (content: string, plainText: string) => void;
  setIsSaving: (saving: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsRewriting: (rewriting: boolean) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  dismissSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  setSelectedBrandVoiceId: (id: string | null) => void;
  filterSuggestions: (type?: string) => AISuggestion[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documentId: null,
  title: "Untitled Document",
  content: "",
  plainText: "",
  isSaving: false,
  isAnalyzing: false,
  isRewriting: false,
  analysis: null,
  suggestions: [],
  dismissedSuggestionIds: new Set(),
  selectedBrandVoiceId: null,
  setDocumentId: (id) => set({ documentId: id }),
  setTitle: (title) => set({ title }),
  setContent: (content, plainText) => set({ content, plainText }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setIsRewriting: (isRewriting) => set({ isRewriting }),
  setAnalysis: (analysis) =>
    set({
      analysis,
      suggestions: analysis?.suggestions ?? [],
      dismissedSuggestionIds: new Set(),
    }),
  dismissSuggestion: (id) => {
    const dismissed = new Set(get().dismissedSuggestionIds);
    dismissed.add(id);
    set({ dismissedSuggestionIds: dismissed });
  },
  acceptSuggestion: (id) => {
    const dismissed = new Set(get().dismissedSuggestionIds);
    dismissed.add(id);
    set({ dismissedSuggestionIds: dismissed });
  },
  setSelectedBrandVoiceId: (id) => set({ selectedBrandVoiceId: id }),
  filterSuggestions: (type) => {
    const { suggestions, dismissedSuggestionIds } = get();
    return suggestions.filter(
      (s) =>
        !dismissedSuggestionIds.has(s.id) &&
        (!type || type === "all" || s.type === type)
    );
  },
}));
