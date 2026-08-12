import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { QUOTATION_ITEM_CATEGORIES } from "@/lib/constants";

const itemSchema = z.object({
  description: z.string().min(1),
  category: z.enum(QUOTATION_ITEM_CATEGORIES).default("OTHER"),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
});

const schema = z.object({
  leadId: z.string().min(1),
  currency: z.string().default("USD"),
  taxRate: z.coerce.number().min(0).max(1).default(0),
  agencyCost: z.coerce.number().nonnegative().optional(),
  validUntil: z.string().optional(),
  // Whether this quote is being sent to the customer right away — if so, we mark
  // it SENT (not DRAFT) and auto-schedule a 3-touch follow-up sequence so the
  // lead doesn't go quiet after the quote goes out.
  markSent: z.boolean().optional().default(false),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const lead = await prisma.lead.findFirst({ where: { id: d.leadId, agencyId: user.agencyId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const subtotal = d.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = subtotal * d.taxRate;
  const total = subtotal + tax;

  const previousCount = await prisma.quotation.count({ where: { leadId: d.leadId } });

  const quotation = await prisma.quotation.create({
    data: {
      leadId: d.leadId,
      agentId: user.id,
      version: previousCount + 1,
      currency: d.currency,
      subtotal,
      tax,
      total,
      agencyCost: d.agencyCost,
      validUntil: d.validUntil ? new Date(d.validUntil) : undefined,
      status: d.markSent ? "SENT" : "DRAFT",
      items: {
        create: d.items.map((i) => ({
          description: i.description,
          category: i.category,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.quantity * i.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  if (lead.stage === "NEW" || lead.stage === "QUALIFIED") {
    await prisma.lead.update({ where: { id: lead.id }, data: { stage: "QUOTED" } });
  }

  if (d.markSent) {
    const now = new Date();
    await prisma.followUp.createMany({
      data: [
        { leadId: lead.id, agentId: user.id, dueAt: addDays(now, 1), message: `Check if they've reviewed quote v${quotation.version}`, type: "FOLLOW_UP" },
        { leadId: lead.id, agentId: user.id, dueAt: addDays(now, 3), message: `Follow up on quote v${quotation.version} — still interested?`, type: "FOLLOW_UP" },
        { leadId: lead.id, agentId: user.id, dueAt: addDays(now, 7), message: `Final check-in on quote v${quotation.version} before it goes cold`, type: "FOLLOW_UP" },
      ],
    });
  }

  return NextResponse.json({ quotation }, { status: 201 });
}
