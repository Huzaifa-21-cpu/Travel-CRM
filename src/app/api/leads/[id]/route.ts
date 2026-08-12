import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LEAD_STAGES } from "@/lib/constants";

const schema = z.object({
  stage: z.enum(LEAD_STAGES).optional(),
  notes: z.string().optional(),
  agentId: z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.lead.findFirst({ where: { id, agencyId: user.agencyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lead = await prisma.lead.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ lead });
}
