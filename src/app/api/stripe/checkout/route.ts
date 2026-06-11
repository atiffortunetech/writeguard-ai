import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, isStripeConfigured, PLAN_DEFINITIONS } from "@/lib/stripe";
import {
  createSubscription,
  findPlanByTier,
  findSubscriptionByUserId,
  updateSubscription,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        {
          error: "Stripe not configured. Set STRIPE_SECRET_KEY and price IDs.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const { tier, interval = "monthly" } = await req.json();

    if (!["PRO", "BUSINESS"].includes(tier)) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
    }

    const planDef = PLAN_DEFINITIONS[tier as "PRO" | "BUSINESS"];
    const priceId =
      interval === "yearly"
        ? planDef.stripePriceIdYearly
        : planDef.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan." },
        { status: 503 }
      );
    }

    const subscription = await findSubscriptionByUserId(session.user.id);

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      if (subscription) {
        await updateSubscription(subscription.id, { stripeCustomerId: customerId });
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        tier,
      },
    });

    if (!subscription) {
      const plan = await findPlanByTier(tier as "PRO" | "BUSINESS");
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      await createSubscription({
        userId: session.user.id,
        planId: plan.id,
        stripeCustomerId: customerId,
        status: "INCOMPLETE",
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
