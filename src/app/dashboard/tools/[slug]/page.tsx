import { notFound, redirect } from "next/navigation";
import { getToolBySlug } from "@/lib/tools-registry";
import { TextToolPage } from "@/components/tools/text-tool-page";
import { CounterToolPage } from "@/components/tools/counter-tool-page";
import {
  ToolAccessGate,
} from "@/components/tools/tool-access-gate";
import { featureIdForToolSlug } from "@/lib/plan-tiers";
import AiChatPage from "../ai-chat/page";
import AiAgentsPage from "../ai-agents/page";
import SnippetsPage from "../snippets/page";
import AnalyticsPage from "../analytics/page";
import ResumeBuilderPage from "../resume-builder/page";
import TranslatorPage from "../translator/page";

const COUNTER_FOCUS: Record<string, "words" | "characters" | "paragraphs" | "sentences"> = {
  "word-counter": "words",
  "character-counter": "characters",
  "paragraph-counter": "paragraphs",
  "sentence-counter": "sentences",
};

const CUSTOM_PAGES: Record<string, React.ComponentType> = {
  "ai-chat": AiChatPage,
  "ai-agents": AiAgentsPage,
  snippets: SnippetsPage,
  "writing-analytics": AnalyticsPage,
  "resume-builder": ResumeBuilderPage,
  translator: TranslatorPage,
};

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || tool.slug === "tools-hub") notFound();

  if (tool.type === "redirect" && tool.href) {
    redirect(tool.href);
  }

  const Custom = CUSTOM_PAGES[slug];
  if (Custom) {
    const featureId = featureIdForToolSlug(slug);
    return (
      <ToolAccessGate
        featureId={featureId}
        featureName={tool.title}
        description={tool.description}
      >
        <Custom />
      </ToolAccessGate>
    );
  }

  if (tool.type === "counter" && COUNTER_FOCUS[slug]) {
    return <CounterToolPage slug={slug} focus={COUNTER_FOCUS[slug]} />;
  }

  if (tool.type === "ai") {
    const featureId = featureIdForToolSlug(slug);
    return (
      <ToolAccessGate
        featureId={featureId}
        featureName={tool.title}
        description={tool.description}
      >
        <TextToolPage slug={slug} />
      </ToolAccessGate>
    );
  }

  notFound();
}

export function generateStaticParams() {
  return [
    "grammar-checker",
    "spell-checker",
    "sentence-checker",
    "punctuation-checker",
    "passive-voice-checker",
    "proofreader",
    "tone-detector",
    "citation-generator",
    "citation-finder",
    "essay-checker",
    "authorship",
    "ai-grader",
    "reader-reactions",
    "word-counter",
    "character-counter",
    "paragraph-counter",
    "sentence-counter",
    "ai-chat",
    "ai-agents",
    "snippets",
    "writing-analytics",
    "resume-builder",
    "translator",
    "smart-rewrite",
  ].map((slug) => ({ slug }));
}
