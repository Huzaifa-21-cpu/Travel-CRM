import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { FOLLOW_UP_TYPES } from "@/lib/constants";

const schema = z.object({
  dueAt: z.string().min(1),
  message: z.string().optional(),
  type: z.enum(FOLLOW_UP_TYPES).default("FOLLOW_UP"),
});

export async function POST(req: NextRequest, ctx: RouteContext<"/api/leads/[id]/follow-ups">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const lead = await prisma.lead.findFirst({ where: { id, agencyId: user.agencyId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const followUp = await prisma.followUp.create({
    data: {
      leadId: id,
      agentId: user.id,
      dueAt: new Date(parsed.data.dueAt),
      message: parsed.data.message,
      type: parsed.data.type,
    },
  });

  return NextResponse.json({ followUp }, { status: 201 });
}
