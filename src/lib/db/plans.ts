import type { Plan, PlanTier } from "@/types/database";
import { PLAN_DEFINITIONS } from "@/lib/stripe";
import { execute, newId, parseJson, query, queryOne, toBool, toJson } from "./connection";

type PlanRow = {
  id: string;
  tier: PlanTier;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  ai_credits_monthly: number;
  max_documents: number;
  max_brand_voices: number;
  features: unknown;
  is_active: number | boolean;
  created_at: Date;
  updated_at: Date;
};

export function mapPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    tier: row.tier,
    name: row.name,
    description: row.description,
    priceMonthly: row.price_monthly,
    priceYearly: row.price_yearly,
    stripePriceIdMonthly: row.stripe_price_id_monthly,
    stripePriceIdYearly: row.stripe_price_id_yearly,
    aiCreditsMonthly: row.ai_credits_monthly,
    maxDocuments: row.max_documents,
    maxBrandVoices: row.max_brand_voices,
    features: parseJson<string[]>(row.features, []),
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findPlanById(id: string): Promise<Plan | null> {
  const row = await queryOne<PlanRow>("SELECT * FROM plans WHERE id = ?", [id]);
  return row ? mapPlan(row) : null;
}

export async function findPlanByTier(tier: PlanTier): Promise<Plan | null> {
  const row = await queryOne<PlanRow>("SELECT * FROM plans WHERE tier = ?", [tier]);
  return row ? mapPlan(row) : null;
}

export async function listPlans(): Promise<Plan[]> {
  const rows = await query<PlanRow>("SELECT * FROM plans ORDER BY price_monthly ASC");
  return rows.map(mapPlan);
}

export type PlanWithSubscriptionCount = Plan & {
  _count: { subscriptions: number };
};

export async function listPlansWithSubscriptionCounts(): Promise<PlanWithSubscriptionCount[]> {
  const rows = await query<PlanRow & { subscription_count: number }>(
    `SELECT p.*, COUNT(s.id) AS subscription_count
     FROM plans p
     LEFT JOIN subscriptions s ON s.plan_id = p.id
     GROUP BY p.id
     ORDER BY p.price_monthly ASC`
  );
  return rows.map((row) => ({
    ...mapPlan(row),
    _count: { subscriptions: Number(row.subscription_count) },
  }));
}

export async function ensureFreePlan(): Promise<Plan> {
  const existing = await findPlanByTier("FREE");
  if (existing) return existing;

  const def = PLAN_DEFINITIONS.FREE;
  const id = newId();
  await execute(
    `INSERT INTO plans (
      id, tier, name, description, price_monthly, price_yearly,
      ai_credits_monthly, max_documents, max_brand_voices, features
    ) VALUES (?, 'FREE', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      def.name,
      def.description,
      def.priceMonthly,
      def.priceYearly,
      def.aiCreditsMonthly,
      def.maxDocuments,
      def.maxBrandVoices,
      toJson(def.features),
    ]
  );

  const plan = await findPlanById(id);
  if (!plan) throw new Error("Failed to create free plan");
  return plan;
}

export async function upsertPlanFromDefinition(tier: PlanTier): Promise<Plan> {
  const def = PLAN_DEFINITIONS[tier];
  const existing = await findPlanByTier(tier);

  if (existing) {
    await execute(
      `UPDATE plans SET
        name = ?, description = ?, price_monthly = ?, price_yearly = ?,
        ai_credits_monthly = ?, max_documents = ?, max_brand_voices = ?,
        features = ?, stripe_price_id_monthly = ?, stripe_price_id_yearly = ?
       WHERE tier = ?`,
      [
        def.name,
        def.description,
        def.priceMonthly,
        def.priceYearly,
        def.aiCreditsMonthly,
        def.maxDocuments,
        def.maxBrandVoices,
        toJson(def.features),
        def.stripePriceIdMonthly ?? null,
        def.stripePriceIdYearly ?? null,
        tier,
      ]
    );
    const plan = await findPlanByTier(tier);
    if (!plan) throw new Error("Failed to update plan");
    return plan;
  }

  const id = newId();
  await execute(
    `INSERT INTO plans (
      id, tier, name, description, price_monthly, price_yearly,
      stripe_price_id_monthly, stripe_price_id_yearly,
      ai_credits_monthly, max_documents, max_brand_voices, features
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tier,
      def.name,
      def.description,
      def.priceMonthly,
      def.priceYearly,
      def.stripePriceIdMonthly ?? null,
      def.stripePriceIdYearly ?? null,
      def.aiCreditsMonthly,
      def.maxDocuments,
      def.maxBrandVoices,
      toJson(def.features),
    ]
  );

  const plan = await findPlanById(id);
  if (!plan) throw new Error("Failed to create plan");
  return plan;
}
