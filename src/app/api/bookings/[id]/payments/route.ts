import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PAYMENT_METHODS } from "@/lib/constants";

const schema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS).default("BANK_TRANSFER"),
  status: z.enum(["PENDING", "PAID"]).default("PAID"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]/payments">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const booking = await prisma.booking.findFirst({ where: { id, agencyId: user.agencyId } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const payment = await prisma.payment.create({
    data: {
      bookingId: id,
      amount: d.amount,
      method: d.method,
      status: d.status,
      notes: d.notes,
      paidAt: d.status === "PAID" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
