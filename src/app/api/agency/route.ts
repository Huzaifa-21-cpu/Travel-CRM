import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({ aiKnowledgeBase: z.string().optional() });

export async function PATCH(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const agency = await prisma.agency.update({
    where: { id: user.agencyId },
    data: { aiKnowledgeBase: parsed.data.aiKnowledgeBase },
  });

  return NextResponse.json({ agency });
}
