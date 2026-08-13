import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, getAppUrl } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing isn't configured yet" }, { status: 503 });
  }

  const user = await requireUser();
  if (user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the agency owner can manage billing" }, { status: 403 });
  }

  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
  if (!agency?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account on file yet" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: agency.stripeCustomerId,
    return_url: `${getAppUrl()}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
