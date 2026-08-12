import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  title: z.string().min(1),
  destination: z.string().optional(),
  travelDate: z.string().optional(),
  pax: z.coerce.number().int().positive().optional(),
  budget: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let customerId = data.customerId;
  if (!customerId) {
    if (!data.customerName || !data.customerPhone) {
      return NextResponse.json(
        { error: "Provide an existing customerId or a customerName + customerPhone" },
        { status: 400 }
      );
    }
    const customer = await prisma.customer.upsert({
      where: { agencyId_phone: { agencyId: user.agencyId, phone: data.customerPhone } },
      update: { name: data.customerName },
      create: { agencyId: user.agencyId, name: data.customerName, phone: data.customerPhone },
    });
    customerId = customer.id;
  }

  const lead = await prisma.lead.create({
    data: {
      agencyId: user.agencyId,
      customerId,
      agentId: user.id,
      title: data.title,
      destination: data.destination,
      travelDate: data.travelDate ? new Date(data.travelDate) : undefined,
      pax: data.pax ?? 1,
      budget: data.budget,
      notes: data.notes,
      stage: "NEW",
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
