import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({ quotationId: z.string().min(1) });

function generateBookingRef() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BK-${rand}`;
}

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const quotation = await prisma.quotation.findFirst({
    where: { id: parsed.data.quotationId, lead: { agencyId: user.agencyId } },
    include: { lead: true },
  });
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const booking = await prisma.booking.create({
    data: {
      agencyId: user.agencyId,
      leadId: quotation.leadId,
      quotationId: quotation.id,
      customerId: quotation.lead.customerId,
      bookingRef: generateBookingRef(),
      status: "CONFIRMED",
      totalAmount: quotation.total,
    },
  });

  await prisma.quotation.update({ where: { id: quotation.id }, data: { status: "ACCEPTED" } });
  await prisma.lead.update({ where: { id: quotation.leadId }, data: { stage: "WON" } });

  return NextResponse.json({ booking }, { status: 201 });
}
