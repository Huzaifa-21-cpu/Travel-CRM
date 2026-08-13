import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, getAppUrl } from "@/lib/stripe";
import { getPlan } from "@/lib/plans";

const schema = z.object({ planId: z.string() });

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing isn't configured yet" }, { status: 503 });
  }

  const user = await requireUser();
  if (user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the agency owner can manage billing" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = getPlan(parsed.data.planId);
  const priceId = plan && process.env[plan.priceEnvVar];
  if (!plan || !priceId) {
    return NextResponse.json({ error: "That plan isn't available" }, { status: 400 });
  }

  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: agency.stripeCustomerId ?? undefined,
    customer_email: agency.stripeCustomerId ? undefined : user.email,
    client_reference_id: agency.id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { agencyId: agency.id, planId: plan.id },
    subscription_data: { metadata: { agencyId: agency.id, planId: plan.id } },
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/settings?billing=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
