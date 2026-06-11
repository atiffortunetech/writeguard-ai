import Stripe from "stripe";
import type { PlanTier } from "@/types/database";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const PLAN_DEFINITIONS: Record<
  PlanTier,
  {
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    aiCreditsMonthly: number;
    maxDocuments: number;
    maxBrandVoices: number;
    features: string[];
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
  }
> = {
  FREE: {
    name: "Free",
    description: "Get started with essential writing checks",
    priceMonthly: 0,
    priceYearly: 0,
    aiCreditsMonthly: 50,
    maxDocuments: 5,
    maxBrandVoices: 0,
    features: [
      "Grammar & spell checker",
      "Tone detector",
      "Word / character / sentence counters",
      "5 documents",
      "50 AI credits / month",
      "Basic editor",
    ],
  },
  PRO: {
    name: "Pro",
    description: "For creators and professionals who write daily",
    priceMonthly: 19,
    priceYearly: 190,
    aiCreditsMonthly: 2000,
    maxDocuments: -1,
    maxBrandVoices: 5,
    features: [
      "Everything in Free",
      "Unlimited documents",
      "2,000 AI credits / month",
      "Proofreader, paraphrase, Smart Rewrite, humanizer",
      "Plagiarism & AI detector",
      "Essay & citation tools",
      "AI chat & AI agents",
      "Brand voice & templates",
      "Amazon listing optimizer",
      "Resume builder & snippets",
      "Brand Image Studio (OpenAI)",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  BUSINESS: {
    name: "Business",
    description: "For teams that need shared voice and style",
    priceMonthly: 49,
    priceYearly: 490,
    aiCreditsMonthly: 10000,
    maxDocuments: -1,
    maxBrandVoices: 20,
    features: [
      "Everything in Pro",
      "10,000 AI credits / month",
      "Team workspace",
      "Style guide",
      "Writing analytics",
      "Authorship analysis",
      "AI grader & reader reactions",
      "20 brand voice profiles",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "Custom limits and enterprise-grade controls",
    priceMonthly: 0,
    priceYearly: 0,
    aiCreditsMonthly: -1,
    maxDocuments: -1,
    maxBrandVoices: -1,
    features: [
      "Everything in Business",
      "Unlimited AI credits",
      "Unlimited brand voices",
      "Priority support",
      "Custom limits & SSO (coming soon)",
    ],
  },
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
