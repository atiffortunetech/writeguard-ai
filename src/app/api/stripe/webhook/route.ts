import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  createSubscription,
  findPlanByTier,
  findSubscriptionByUserId,
  updateSubscription,
  updateSubscriptionsByStripeId,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          const plan = await findPlanByTier(tier as "PRO" | "BUSINESS");

          if (plan) {
            const existing = await findSubscriptionByUserId(userId);

            const subscriptionData = {
              planId: plan.id,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: "ACTIVE" as const,
            };

            if (existing) {
              await updateSubscription(existing.id, subscriptionData);
            } else {
              await createSubscription({ userId, ...subscriptionData });
            }
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriptionsByStripeId(subscription.id, {
          status:
            subscription.status === "active"
              ? "ACTIVE"
              : subscription.status === "trialing"
                ? "TRIALING"
                : "CANCELED",
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
