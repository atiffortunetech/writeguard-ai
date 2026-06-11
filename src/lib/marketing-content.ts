import {
  SpellCheck,
  Wand2,
  ScanSearch,
  Shield,
  RefreshCw,
  Mic2,
  Users,
  BookOpen,
  Bot,
  MessageSquare,
  FileUser,
  GraduationCap,
  Quote,
  BarChart3,
  ShoppingBag,
  PenLine,
  Sparkles,
  Brain,
  type LucideIcon,
} from "lucide-react";

export const TRUST_STATS = {
  headline: "Trusted by writers, teams, and sellers worldwide",
  items: ["10K+", "Active writers", "30+", "AI writing tools", "99.9%", "Uptime", "4.9★", "User rating"],
};

export const HERO_AGENTS = [
  {
    title: "Writing Studio",
    description: "Full intelligence scan — scores, readability, AI risk.",
    icon: Brain,
    href: "/features#intelligence",
  },
  {
    title: "Paragraph rewrites",
    description: "Improve clarity and flow with one click.",
    icon: RefreshCw,
    href: "/features#rewrite",
  },
  {
    title: "Tone suggestions",
    description: "Adapt your message for any audience.",
    icon: Mic2,
    href: "/features#tone",
  },
  {
    title: "Proofreading",
    description: "Refine grammar, structure, and clarity.",
    icon: SpellCheck,
    href: "/features#grammar",
  },
  {
    title: "Humanizer agent",
    description: "Give your writing a natural voice.",
    icon: Wand2,
    href: "/features#humanizer",
  },
  {
    title: "AI Detector agent",
    description: "Spot AI-generated text and revise it.",
    icon: ScanSearch,
    href: "/features#ai-detector",
  },
];

export const SHOWCASE_SECTIONS = [
  {
    id: "results",
    eyebrow: "Better writing, better results",
    title: "Be clear, credible, and impossible to ignore",
    description:
      "WriteGuard AI catches mistakes, sharpens your message, and helps you publish with confidence — in a few clicks, not a few hours.",
    bullets: ["Real-time grammar & clarity scores", "One-click sentence rewrites", "Brand voice alignment"],
    imageSide: "right" as const,
    gradient: "from-violet-500/10 to-cyan-500/10",
  },
  {
    id: "voice",
    eyebrow: "Keep your voice, make it clear",
    title: "Sound like you — only sharper",
    description:
      "Get suggestions that help you strike the right tone without losing your authentic voice, whether you're writing for yourself or your brand.",
    bullets: ["14 tone categories", "Brand voice profiles", "Style guide enforcement"],
    imageSide: "left" as const,
    gradient: "from-fuchsia-500/10 to-violet-500/10",
  },
  {
    id: "audience",
    eyebrow: "Get a read on your writing",
    title: "See your work through your reader's eyes",
    description:
      "Understand how your audience will react before you hit publish. Reader reactions and AI grading help you iterate faster.",
    bullets: ["Reader reaction previews", "AI grader feedback", "Writing analytics dashboard"],
    imageSide: "right" as const,
    gradient: "from-cyan-500/10 to-emerald-500/10",
  },
];

export const SECURITY_SECTION = {
  eyebrow: "This is responsible AI",
  title: "Security you can trust",
  description:
    "We don't sell your content for advertising. Your writing stays yours — with confidential processing options for sensitive business content.",
  points: ["No training on your private documents", "Encrypted data in transit", "Admin controls for teams"],
};

export interface NavGroup {
  label: string;
  href?: string;
  columns?: {
    title: string;
    links: { label: string; href: string; description?: string }[];
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Product",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Features", href: "/features", description: "Full writing workspace" },
          { label: "AI Agents", href: "/features#agents", description: "Humanizer, detector & more" },
          { label: "Editor", href: "/signup", description: "Smart document editor" },
          { label: "Trust & security", href: "/features#security", description: "Privacy-first AI" },
        ],
      },
      {
        title: "For teams",
        links: [
          { label: "Team workspace", href: "/features#teams", description: "Collaborate in one place" },
          { label: "Style guide", href: "/features#style", description: "Shared brand rules" },
          { label: "Brand voice", href: "/features#brand", description: "Stay on-brand" },
        ],
      },
    ],
  },
  {
    label: "Tools",
    href: "/tools",
    columns: [
      {
        title: "Correctness",
        links: [
          { label: "Grammar Checker", href: "/tools#grammar-checker" },
          { label: "Spell Checker", href: "/tools#spell-checker" },
          { label: "Proofreader", href: "/tools#proofreader" },
        ],
      },
      {
        title: "AI Intelligence",
        links: [
          { label: "AI Humanizer", href: "/tools#ai-humanizer" },
          { label: "AI Detector", href: "/tools#ai-detector" },
          { label: "Plagiarism Checker", href: "/tools#plagiarism-checker" },
          { label: "Paraphrasing Tool", href: "/tools#paraphrase" },
          { label: "Translator", href: "/tools#translator" },
        ],
      },
      {
        title: "Productivity",
        links: [
          { label: "AI Chat", href: "/tools#ai-chat" },
          { label: "Resume Builder", href: "/tools#resume-builder" },
          { label: "Citation Generator", href: "/tools#citation-generator" },
          { label: "Word Counter", href: "/tools#word-counter" },
        ],
      },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
];

export interface FeatureGroup {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: { title: string; description: string }[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "grammar",
    title: "Correctness & clarity",
    description: "Catch every mistake before your reader does.",
    icon: SpellCheck,
    features: [
      { title: "Grammar Checker", description: "Real-time grammar, spelling, and clarity suggestions with explanations." },
      { title: "Spell & punctuation", description: "Dedicated checkers for spelling, commas, apostrophes, and more." },
      { title: "Sentence structure", description: "Improve flow, fix run-ons, and tighten wordy passages." },
      { title: "Passive voice", description: "Spot passive constructions and rewrite for stronger impact." },
    ],
  },
  {
    id: "rewrite",
    title: "Rewrite & tone",
    description: "Say it better without losing your meaning.",
    icon: RefreshCw,
    features: [
      { title: "Proofreader", description: "Full-document polish for grammar, structure, and readability." },
      { title: "Paraphrase", description: "Rephrase sentences while preserving intent." },
      { title: "Tone detector", description: "Detect and adjust tone across 14 categories." },
      { title: "Sentence rewrites", description: "One-click alternatives for clarity, persuasion, or brevity." },
    ],
  },
  {
    id: "humanizer",
    title: "AI intelligence",
    description: "Human-quality writing powered by responsible AI.",
    icon: Wand2,
    features: [
      { title: "AI Humanizer", description: "Transform AI drafts into natural, engaging prose." },
      { title: "AI Detector", description: "Probabilistic detection with clear disclaimers." },
      { title: "Plagiarism checker", description: "Compare content against web sources." },
      { title: "AI chat & agents", description: "Conversational writing help and specialized agents." },
    ],
  },
  {
    id: "brand",
    title: "Brand & style",
    description: "Every word on-brand, every time.",
    icon: Mic2,
    features: [
      { title: "Brand voice profiles", description: "Vocabulary rules, personality traits, and example content." },
      { title: "Style guide", description: "US/UK English, forbidden words, and capitalization rules." },
      { title: "Snippets", description: "Reusable text blocks for faster writing." },
      { title: "Templates", description: "Blogs, emails, ads, landing pages, and more." },
    ],
  },
  {
    id: "teams",
    title: "Teams & collaboration",
    description: "Write together without losing consistency.",
    icon: Users,
    features: [
      { title: "Team workspace", description: "Shared documents, voices, and style guides." },
      { title: "Writing analytics", description: "Track usage, credits, and productivity." },
      { title: "Activity logs", description: "See who changed what and when." },
      { title: "Role-based access", description: "Owner, admin, and member permissions." },
    ],
  },
  {
    id: "agents",
    title: "Specialized agents",
    description: "Purpose-built tools for specific writing jobs.",
    icon: Bot,
    features: [
      { title: "Resume builder", description: "Structured sections with AI-powered bullet points." },
      { title: "Citation finder", description: "Discover and format sources quickly." },
      { title: "AI grader", description: "Score essays and long-form content." },
      { title: "Reader reactions", description: "Preview how different audiences might respond." },
    ],
  },
  {
    id: "commerce",
    title: "Commerce & SEO",
    description: "Optimized copy that converts.",
    icon: ShoppingBag,
    features: [
      { title: "Amazon listing optimizer", description: "SEO titles, bullets, descriptions, and backend terms." },
      { title: "Essay checker", description: "Academic writing feedback and structure tips." },
      { title: "Citation generator", description: "APA, MLA, Chicago, and more." },
      { title: "Content templates", description: "Platform-specific formats ready to fill in." },
    ],
  },
  {
    id: "security",
    title: "Trust & security",
    description: "Enterprise-ready from day one.",
    icon: Shield,
    features: [
      { title: "Confidential mode", description: "Sensitive content processing options." },
      { title: "No ad monetization", description: "Your content is never sold for advertising." },
      { title: "Encrypted transit", description: "Secure connections for all API requests." },
      { title: "Admin controls", description: "Manage users, limits, and team access." },
    ],
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "All tools", href: "/tools" },
      { label: "Pricing", href: "/pricing" },
      { label: "Editor", href: "/signup" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Grammar Checker", href: "/tools#grammar-checker" },
      { label: "AI Humanizer", href: "/tools#ai-humanizer" },
      { label: "Plagiarism Checker", href: "/tools#plagiarism-checker" },
      { label: "Paraphrasing Tool", href: "/tools#paraphrase" },
      { label: "AI Chat", href: "/tools#ai-chat" },
      { label: "Word Counter", href: "/tools#word-counter" },
    ],
  },
  {
    title: "Agents",
    links: [
      { label: "Resume Builder", href: "/tools#resume-builder" },
      { label: "Citation Finder", href: "/tools#citation-finder" },
      { label: "AI Grader", href: "/tools#ai-grader" },
      { label: "Reader Reactions", href: "/tools#reader-reactions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign up", href: "/signup" },
      { label: "Log in", href: "/login" },
      { label: "Contact sales", href: "mailto:sales@writeguard.ai" },
    ],
  },
];

export const COMPETITOR_COMPARISON: {
  feature: string;
  writeguard: boolean | "partial";
  grammarly: boolean | "partial";
  quillbot: boolean | "partial";
}[] = [
  { feature: "30+ tools in one app", writeguard: true, grammarly: "partial", quillbot: "partial" },
  { feature: "Writing intelligence scan (scores + readability)", writeguard: true, grammarly: "partial", quillbot: false },
  { feature: "AI humanizer + AI detector", writeguard: true, grammarly: false, quillbot: "partial" },
  { feature: "Plagiarism checker", writeguard: true, grammarly: true, quillbot: false },
  { feature: "Translator (40+ languages)", writeguard: true, grammarly: false, quillbot: false },
  { feature: "Smart Rewrite (8 modes)", writeguard: true, grammarly: false, quillbot: "partial" },
  { feature: "Brand voice + style guide", writeguard: true, grammarly: "partial", quillbot: false },
  { feature: "Amazon listing optimizer", writeguard: true, grammarly: false, quillbot: false },
  { feature: "Brand image studio", writeguard: true, grammarly: false, quillbot: false },
  { feature: "Team workspace", writeguard: true, grammarly: "partial", quillbot: false },
];

export const WORK_AUDIENCES = [
  { icon: PenLine, title: "Individuals", description: "Students, creators, and professionals who write daily." },
  { icon: Users, title: "Teams & business", description: "Marketing, support, and ops teams that need shared voice." },
  { icon: GraduationCap, title: "Education", description: "Institutions and students with academic integrity tools." },
  { icon: ShoppingBag, title: "E-commerce", description: "Amazon sellers and brands optimizing product listings." },
];

export const QUICK_TOOLS: { slug: string; title: string; icon: LucideIcon; tier: string }[] = [
  { slug: "grammar-checker", title: "Grammar Checker", icon: SpellCheck, tier: "Free" },
  { slug: "writing-studio", title: "Writing Studio", icon: Sparkles, tier: "Free" },
  { slug: "translator", title: "Translator", icon: BookOpen, tier: "Free" },
  { slug: "ai-humanizer", title: "AI Humanizer", icon: Wand2, tier: "Pro" },
  { slug: "plagiarism-checker", title: "Plagiarism Checker", icon: Shield, tier: "Pro" },
  { slug: "ai-detector", title: "AI Detector", icon: ScanSearch, tier: "Pro" },
  { slug: "paraphrase", title: "Paraphrasing Tool", icon: RefreshCw, tier: "Pro" },
  { slug: "ai-chat", title: "AI Chat", icon: MessageSquare, tier: "Pro" },
  { slug: "citation-generator", title: "Citation Generator", icon: Quote, tier: "Pro" },
  { slug: "word-counter", title: "Word Counter", icon: BookOpen, tier: "Free" },
  { slug: "resume-builder", title: "Resume Builder", icon: FileUser, tier: "Pro" },
  { slug: "tone-detector", title: "Tone Detector", icon: Mic2, tier: "Free" },
  { slug: "writing-analytics", title: "Writing Analytics", icon: BarChart3, tier: "Business" },
  { slug: "ai-grader", title: "AI Grader", icon: Sparkles, tier: "Business" },
];
