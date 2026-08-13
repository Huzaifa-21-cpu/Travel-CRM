import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { QUOTATION_STATUSES } from "@/lib/constants";

const schema = z.object({
  status: z.enum(QUOTATION_STATUSES).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/quotations/[id]">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.quotation.findFirst({
    where: { id, lead: { agencyId: user.agencyId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const quotation = await prisma.quotation.update({ where: { id }, data: parsed.data });

  // A quote moving to NEGOTIATING is a strong buy signal — nudge the lead stage.
  if (parsed.data.status === "NEGOTIATING") {
    await prisma.lead.updateMany({
      where: { id: existing.leadId, stage: { in: ["NEW", "QUALIFIED", "QUOTED"] } },
      data: { stage: "NEGOTIATION" },
    });
  }

  return NextResponse.json({ quotation });
}
