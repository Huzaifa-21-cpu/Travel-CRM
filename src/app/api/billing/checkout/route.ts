import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTapConfigured, tapRequest, getAppUrl } from "@/lib/tap";
import { getPlan } from "@/lib/plans";

const schema = z.object({ planId: z.string() });

export async function POST(req: NextRequest) {
  if (!isTapConfigured()) {
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
  if (!plan) {
    return NextResponse.json({ error: "That plan isn't available" }, { status: 400 });
  }

  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  const appUrl = getAppUrl();
  const [firstName, ...restName] = user.name.trim().split(/\s+/);

  // source.id "src_all" hands the entire card-collection page to Tap's hosted
  // checkout — we never touch card data, so this stays out of PCI scope.
  const charge = await tapRequest("/charges", {
    amount: plan.price,
    currency: "USD",
    customer: {
      first_name: firstName || user.name,
      last_name: restName.join(" ") || firstName || user.name,
      email: user.email,
    },
    source: { id: "src_all" },
    description: `${plan.name} plan — ${agency.name}`,
    reference: { order: `${agency.id}:${plan.id}` },
    redirect: { url: `${appUrl}/settings?billing=success` },
    post: { url: `${appUrl}/api/webhooks/tap` },
  });

  if (!charge.transaction?.url) {
    return NextResponse.json({ error: "Tap didn't return a payment link" }, { status: 502 });
  }

  return NextResponse.json({ url: charge.transaction.url });
}
