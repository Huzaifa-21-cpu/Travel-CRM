import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { isTapConfigured } from "@/lib/tap";
import { BILLING_PERIOD_DAYS } from "@/lib/plans";

type TapCharge = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer?: { id?: string };
  reference?: { order?: string; gateway?: string; payment?: string };
  transaction?: { created?: string };
};

// Tap signs webhooks with a "hashstring" header: HMAC-SHA256 of the labeled,
// concatenated charge fields below, keyed with the same secret API key used
// for outbound requests (Tap has no separate webhook signing secret).
function isValidSignature(payload: TapCharge, header: string | null, secretKey: string) {
  if (!header) return false;
  const message =
    `x_id${payload.id}` +
    `x_amount${payload.amount}` +
    `x_currency${payload.currency}` +
    `x_gateway_reference${payload.reference?.gateway ?? ""}` +
    `x_payment_reference${payload.reference?.payment ?? ""}` +
    `x_status${payload.status}` +
    `x_created${payload.transaction?.created ?? ""}`;
  const expected = Buffer.from(createHmac("sha256", secretKey).update(message).digest("hex"));
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.TAP_SECRET_KEY;
  if (!isTapConfigured() || !secretKey) {
    return NextResponse.json({ error: "Billing isn't configured yet" }, { status: 503 });
  }

  const rawBody = await req.text();
  let payload: TapCharge;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isValidSignature(payload, req.headers.get("hashstring"), secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const [agencyId, planId] = payload.reference?.order?.split(":") ?? [];

  if (agencyId && payload.status === "CAPTURED") {
    await prisma.agency.updateMany({
      where: { id: agencyId },
      data: {
        plan: planId,
        subscriptionStatus: "active",
        tapCustomerId: payload.customer?.id,
        currentPeriodEnd: new Date(Date.now() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json({ received: true });
}
