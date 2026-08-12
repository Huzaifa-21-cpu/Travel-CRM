import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/customers/[id]/family/[memberId]">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await ctx.params;
  const member = await prisma.familyMember.findFirst({
    where: { id: memberId, customerId: id, customer: { agencyId: user.agencyId } },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.familyMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
