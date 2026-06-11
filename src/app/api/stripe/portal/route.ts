import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { findActiveSubscription, findSubscriptionByUserId } from "@/lib/db";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    const subscription =
      (await findActiveSubscription(session.user.id)) ??
      (await findSubscriptionByUserId(session.user.id));

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
