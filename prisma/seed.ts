import { prisma } from "../src/lib/prisma";
import { PLAN_DEFINITIONS } from "../src/lib/stripe";
import type { PlanTier } from "../src/generated/prisma/client";

const TEMPLATES = [
  {
    slug: "blog-intro",
    name: "Blog Introduction",
    description: "Write an engaging blog post introduction",
    category: "Blog",
    isPremium: false,
    prompt: "Write a compelling blog post introduction that hooks the reader, establishes the topic, and previews what they'll learn.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true },
      { name: "audience", label: "Target audience", type: "text", required: false },
      { name: "keyPoint", label: "Main takeaway", type: "text", required: false },
    ],
  },
  {
    slug: "blog-outline",
    name: "Blog Outline",
    description: "Generate a structured blog post outline",
    category: "Blog",
    isPremium: false,
    prompt: "Create a detailed blog post outline with H2 and H3 headings, key points for each section, and a suggested word count per section.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true },
      { name: "keywords", label: "SEO keywords", type: "text", required: false },
    ],
  },
  {
    slug: "product-description",
    name: "Product Description",
    description: "Write a compelling product description",
    category: "E-commerce",
    isPremium: true,
    prompt: "Write a benefit-driven product description that converts browsers into buyers. Focus on outcomes, not just features.",
    fields: [
      { name: "productName", label: "Product name", type: "text", required: true },
      { name: "features", label: "Key features", type: "textarea", required: true },
      { name: "audience", label: "Target customer", type: "text", required: false },
    ],
  },
  {
    slug: "amazon-title",
    name: "Amazon Title",
    description: "Generate an SEO-optimized Amazon product title",
    category: "Amazon",
    isPremium: true,
    prompt: "Write an Amazon product title under 200 characters. Include primary keywords naturally. Lead with brand if provided.",
    fields: [
      { name: "productName", label: "Product name", type: "text", required: true },
      { name: "brand", label: "Brand", type: "text", required: false },
      { name: "keywords", label: "Main keywords", type: "text", required: true },
    ],
  },
  {
    slug: "amazon-bullets",
    name: "Amazon Bullet Points",
    description: "Generate 5 benefit-driven Amazon bullet points",
    category: "Amazon",
    isPremium: true,
    prompt: "Write exactly 5 Amazon bullet points. Each bullet starts with a capitalized benefit phrase in ALL CAPS followed by a dash and supporting detail. Max 500 characters each.",
    fields: [
      { name: "productName", label: "Product name", type: "text", required: true },
      { name: "features", label: "Product features", type: "textarea", required: true },
    ],
  },
  {
    slug: "linkedin-post",
    name: "LinkedIn Post",
    description: "Create an engaging LinkedIn post",
    category: "Social",
    isPremium: false,
    prompt: "Write a LinkedIn post with a strong hook, valuable insights, and a clear call-to-action. Use short paragraphs and line breaks for readability.",
    fields: [
      { name: "topic", label: "Topic or idea", type: "text", required: true },
      { name: "goal", label: "Post goal", type: "text", required: false },
    ],
  },
  {
    slug: "email-reply",
    name: "Email Reply",
    description: "Draft a professional email reply",
    category: "Email",
    isPremium: false,
    prompt: "Write a clear, professional email reply based on the context provided. Match the appropriate tone and address all points raised.",
    fields: [
      { name: "context", label: "Email context", type: "textarea", required: true },
      { name: "keyPoints", label: "Points to address", type: "textarea", required: true },
    ],
  },
  {
    slug: "cold-email",
    name: "Cold Email",
    description: "Write a persuasive cold outreach email",
    category: "Email",
    isPremium: true,
    prompt: "Write a concise cold email with a personalized opening, clear value proposition, social proof hint, and soft CTA. Keep under 150 words.",
    fields: [
      { name: "prospect", label: "Prospect/company", type: "text", required: true },
      { name: "offer", label: "Your offer/value", type: "textarea", required: true },
      { name: "personalization", label: "Personalization hook", type: "text", required: false },
    ],
  },
  {
    slug: "ad-copy",
    name: "Ad Copy",
    description: "Generate high-converting ad copy",
    category: "Marketing",
    isPremium: true,
    prompt: "Write ad copy with a headline, primary text, and call-to-action. Focus on benefits and urgency without being pushy.",
    fields: [
      { name: "product", label: "Product/service", type: "text", required: true },
      { name: "platform", label: "Ad platform", type: "text", required: false },
      { name: "audience", label: "Target audience", type: "text", required: false },
    ],
  },
  {
    slug: "landing-page-section",
    name: "Landing Page Section",
    description: "Write a landing page hero or section",
    category: "Marketing",
    isPremium: true,
    prompt: "Write a conversion-focused landing page section with headline, subheadline, body copy, and CTA button text.",
    fields: [
      { name: "product", label: "Product/service", type: "text", required: true },
      { name: "section", label: "Section type (hero, features, etc.)", type: "text", required: true },
      { name: "benefits", label: "Key benefits", type: "textarea", required: true },
    ],
  },
  {
    slug: "meta-tags",
    name: "Meta Title & Description",
    description: "Generate SEO meta title and description",
    category: "SEO",
    isPremium: false,
    prompt: "Write an SEO meta title (max 60 chars) and meta description (max 155 chars). Include primary keyword naturally. Return both in the content field clearly labeled.",
    fields: [
      { name: "pageTopic", label: "Page topic", type: "text", required: true },
      { name: "keywords", label: "Primary keyword", type: "text", required: true },
    ],
  },
  {
    slug: "faq-generator",
    name: "FAQ Generator",
    description: "Generate FAQ questions and answers",
    category: "Content",
    isPremium: false,
    prompt: "Generate 8-10 frequently asked questions with clear, helpful answers for the given product or topic.",
    fields: [
      { name: "topic", label: "Product or topic", type: "text", required: true },
      { name: "audience", label: "Target audience", type: "text", required: false },
    ],
  },
  {
    slug: "case-study-outline",
    name: "Case Study Outline",
    description: "Structure a compelling case study",
    category: "Content",
    isPremium: true,
    prompt: "Create a case study outline with sections: Challenge, Solution, Implementation, Results, and Key Takeaways. Include bullet points for each section.",
    fields: [
      { name: "client", label: "Client/industry", type: "text", required: true },
      { name: "challenge", label: "Main challenge", type: "textarea", required: true },
      { name: "solution", label: "Solution provided", type: "textarea", required: true },
    ],
  },
  {
    slug: "weekly-report",
    name: "Weekly Report Summary",
    description: "Summarize weekly work into a report",
    category: "Business",
    isPremium: false,
    prompt: "Write a professional weekly report summary with accomplishments, metrics, blockers, and next week's priorities.",
    fields: [
      { name: "accomplishments", label: "Accomplishments", type: "textarea", required: true },
      { name: "metrics", label: "Key metrics", type: "textarea", required: false },
      { name: "blockers", label: "Blockers", type: "textarea", required: false },
    ],
  },
  {
    slug: "client-report",
    name: "Client Report",
    description: "Write a professional client status report",
    category: "Business",
    isPremium: true,
    prompt: "Write a polished client report with executive summary, progress update, deliverables completed, upcoming milestones, and recommendations.",
    fields: [
      { name: "clientName", label: "Client name", type: "text", required: true },
      { name: "project", label: "Project name", type: "text", required: true },
      { name: "updates", label: "Progress updates", type: "textarea", required: true },
    ],
  },
];

async function main() {
  for (const tier of Object.keys(PLAN_DEFINITIONS) as PlanTier[]) {
    const plan = PLAN_DEFINITIONS[tier];
    await prisma.plan.upsert({
      where: { tier },
      create: {
        tier,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        aiCreditsMonthly: plan.aiCreditsMonthly,
        maxDocuments: plan.maxDocuments,
        maxBrandVoices: plan.maxBrandVoices,
        features: plan.features,
        stripePriceIdMonthly: plan.stripePriceIdMonthly,
        stripePriceIdYearly: plan.stripePriceIdYearly,
      },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        aiCreditsMonthly: plan.aiCreditsMonthly,
        maxDocuments: plan.maxDocuments,
        maxBrandVoices: plan.maxBrandVoices,
        features: plan.features,
      },
    });
  }

  for (const t of TEMPLATES) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      create: {
        slug: t.slug,
        name: t.name,
        description: t.description,
        category: t.category,
        prompt: t.prompt,
        fields: t.fields,
        isPremium: t.isPremium,
        isActive: true,
      },
      update: {
        name: t.name,
        description: t.description,
        category: t.category,
        prompt: t.prompt,
        fields: t.fields,
        isPremium: t.isPremium,
      },
    });
  }

  console.log("Seeded plans and templates successfully");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
