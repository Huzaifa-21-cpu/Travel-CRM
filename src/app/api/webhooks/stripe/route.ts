import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPlanByPriceId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing isn't configured yet" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const agencyId = session.metadata?.agencyId ?? session.client_reference_id;
      const planId = session.metadata?.planId;
      if (agencyId && session.customer && session.subscription) {
        await prisma.agency.update({
          where: { id: agencyId },
          data: {
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            plan: planId ?? undefined,
            subscriptionStatus: "active",
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const agencyId = subscription.metadata?.agencyId;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? getPlanByPriceId(priceId) : undefined;
      const periodEndItem = subscription.items.data[0];

      const where = agencyId ? { id: agencyId } : { stripeSubscriptionId: subscription.id };
      await prisma.agency.updateMany({
        where,
        data: {
          subscriptionStatus: subscription.status,
          plan: plan?.id,
          currentPeriodEnd: periodEndItem?.current_period_end
            ? new Date(periodEndItem.current_period_end * 1000)
            : undefined,
        },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
