import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  validUntil: z.string().optional(),
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
      validUntil: d.validUntil ? new Date(d.validUntil) : undefined,
      status: "DRAFT",
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

  return NextResponse.json({ quotation }, { status: 201 });
}
