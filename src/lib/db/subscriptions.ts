import type { Plan, Subscription, SubscriptionStatus } from "@/types/database";
import { execute, newId, query, queryOne, toBool, type QueryParam } from "./connection";
import { mapPlan } from "./plans";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: Date | null;
  current_period_end: Date | null;
  cancel_at_period_end: number | boolean;
  created_at: Date;
  updated_at: Date;
};

export function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: toBool(row.cancel_at_period_end),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findSubscriptionById(id: string): Promise<Subscription | null> {
  const row = await queryOne<SubscriptionRow>(
    "SELECT * FROM subscriptions WHERE id = ?",
    [id]
  );
  return row ? mapSubscription(row) : null;
}

export async function findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const row = await queryOne<SubscriptionRow>(
    "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  return row ? mapSubscription(row) : null;
}

export async function findActiveSubscription(
  userId: string
): Promise<(Subscription & { plan: Plan }) | null> {
  const row = await queryOne<
    SubscriptionRow & {
      plan_id: string;
      plan_tier: string;
      plan_name: string;
      plan_description: string | null;
      plan_price_monthly: number;
      plan_price_yearly: number;
      plan_stripe_price_id_monthly: string | null;
      plan_stripe_price_id_yearly: string | null;
      plan_ai_credits_monthly: number;
      plan_max_documents: number;
      plan_max_brand_voices: number;
      plan_features: unknown;
      plan_is_active: number;
      plan_created_at: Date;
      plan_updated_at: Date;
    }
  >(
    `SELECT s.*,
            p.id AS plan_id, p.tier AS plan_tier, p.name AS plan_name,
            p.description AS plan_description, p.price_monthly AS plan_price_monthly,
            p.price_yearly AS plan_price_yearly,
            p.stripe_price_id_monthly AS plan_stripe_price_id_monthly,
            p.stripe_price_id_yearly AS plan_stripe_price_id_yearly,
            p.ai_credits_monthly AS plan_ai_credits_monthly,
            p.max_documents AS plan_max_documents,
            p.max_brand_voices AS plan_max_brand_voices,
            p.features AS plan_features, p.is_active AS plan_is_active,
            p.created_at AS plan_created_at, p.updated_at AS plan_updated_at
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = ? AND s.status IN ('ACTIVE', 'TRIALING')
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (!row) return null;

  return {
    ...mapSubscription(row),
    plan: mapPlan({
      id: row.plan_id,
      tier: row.plan_tier as Plan["tier"],
      name: row.plan_name,
      description: row.plan_description,
      price_monthly: row.plan_price_monthly,
      price_yearly: row.plan_price_yearly,
      stripe_price_id_monthly: row.plan_stripe_price_id_monthly,
      stripe_price_id_yearly: row.plan_stripe_price_id_yearly,
      ai_credits_monthly: row.plan_ai_credits_monthly,
      max_documents: row.plan_max_documents,
      max_brand_voices: row.plan_max_brand_voices,
      features: row.plan_features,
      is_active: row.plan_is_active,
      created_at: row.plan_created_at,
      updated_at: row.plan_updated_at,
    }),
  };
}

export async function listActiveSubscriptionsWithPlans(): Promise<
  Array<Subscription & { plan: Plan }>
> {
  const rows = await query<
    SubscriptionRow & {
      plan_id: string;
      plan_tier: string;
      plan_name: string;
      plan_description: string | null;
      plan_price_monthly: number;
      plan_price_yearly: number;
      plan_stripe_price_id_monthly: string | null;
      plan_stripe_price_id_yearly: string | null;
      plan_ai_credits_monthly: number;
      plan_max_documents: number;
      plan_max_brand_voices: number;
      plan_features: unknown;
      plan_is_active: number;
      plan_created_at: Date;
      plan_updated_at: Date;
    }
  >(
    `SELECT s.*,
            p.id AS plan_id, p.tier AS plan_tier, p.name AS plan_name,
            p.description AS plan_description, p.price_monthly AS plan_price_monthly,
            p.price_yearly AS plan_price_yearly,
            p.stripe_price_id_monthly AS plan_stripe_price_id_monthly,
            p.stripe_price_id_yearly AS plan_stripe_price_id_yearly,
            p.ai_credits_monthly AS plan_ai_credits_monthly,
            p.max_documents AS plan_max_documents,
            p.max_brand_voices AS plan_max_brand_voices,
            p.features AS plan_features, p.is_active AS plan_is_active,
            p.created_at AS plan_created_at, p.updated_at AS plan_updated_at
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.status IN ('ACTIVE', 'TRIALING')
     ORDER BY s.created_at DESC`
  );

  return rows.map((row) => ({
    ...mapSubscription(row),
    plan: mapPlan({
      id: row.plan_id,
      tier: row.plan_tier as Plan["tier"],
      name: row.plan_name,
      description: row.plan_description,
      price_monthly: row.plan_price_monthly,
      price_yearly: row.plan_price_yearly,
      stripe_price_id_monthly: row.plan_stripe_price_id_monthly,
      stripe_price_id_yearly: row.plan_stripe_price_id_yearly,
      ai_credits_monthly: row.plan_ai_credits_monthly,
      max_documents: row.plan_max_documents,
      max_brand_voices: row.plan_max_brand_voices,
      features: row.plan_features,
      is_active: row.plan_is_active,
      created_at: row.plan_created_at,
      updated_at: row.plan_updated_at,
    }),
  }));
}

export type CreateSubscriptionInput = {
  userId: string;
  planId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
};

export async function createSubscription(data: CreateSubscriptionInput): Promise<Subscription> {
  const id = newId();
  await execute(
    `INSERT INTO subscriptions (
      id, user_id, plan_id, stripe_customer_id, stripe_subscription_id,
      status, current_period_start, current_period_end, cancel_at_period_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.planId,
      data.stripeCustomerId ?? null,
      data.stripeSubscriptionId ?? null,
      data.status ?? "ACTIVE",
      data.currentPeriodStart ?? null,
      data.currentPeriodEnd ?? null,
      data.cancelAtPeriodEnd ? 1 : 0,
    ]
  );
  const sub = await findSubscriptionById(id);
  if (!sub) throw new Error("Failed to create subscription");
  return sub;
}

export type UpdateSubscriptionInput = Partial<{
  planId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}>;

export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionInput
): Promise<Subscription> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.planId !== undefined) {
    fields.push("plan_id = ?");
    values.push(data.planId);
  }
  if (data.stripeCustomerId !== undefined) {
    fields.push("stripe_customer_id = ?");
    values.push(data.stripeCustomerId);
  }
  if (data.stripeSubscriptionId !== undefined) {
    fields.push("stripe_subscription_id = ?");
    values.push(data.stripeSubscriptionId);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }
  if (data.currentPeriodStart !== undefined) {
    fields.push("current_period_start = ?");
    values.push(data.currentPeriodStart);
  }
  if (data.currentPeriodEnd !== undefined) {
    fields.push("current_period_end = ?");
    values.push(data.currentPeriodEnd);
  }
  if (data.cancelAtPeriodEnd !== undefined) {
    fields.push("cancel_at_period_end = ?");
    values.push(data.cancelAtPeriodEnd ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE subscriptions SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const sub = await findSubscriptionById(id);
  if (!sub) throw new Error("Subscription not found");
  return sub;
}

export async function updateSubscriptionsByStripeId(
  stripeSubscriptionId: string,
  data: UpdateSubscriptionInput
): Promise<number> {
  const fields: string[] = [];
  const values: QueryParam[] = [];

  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }
  if (data.cancelAtPeriodEnd !== undefined) {
    fields.push("cancel_at_period_end = ?");
    values.push(data.cancelAtPeriodEnd ? 1 : 0);
  }
  if (data.planId !== undefined) {
    fields.push("plan_id = ?");
    values.push(data.planId);
  }

  if (fields.length === 0) return 0;

  values.push(stripeSubscriptionId);
  const result = await execute(
    `UPDATE subscriptions SET ${fields.join(", ")} WHERE stripe_subscription_id = ?`,
    values
  );
  return result.affectedRows;
}

export async function countActiveSubscriptions(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.status IN ('ACTIVE', 'TRIALING') AND p.tier != 'FREE'`
  );
  return Number(row?.count ?? 0);
}

export async function countSubscriptions(): Promise<number> {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM subscriptions"
  );
  return Number(row?.count ?? 0);
}
