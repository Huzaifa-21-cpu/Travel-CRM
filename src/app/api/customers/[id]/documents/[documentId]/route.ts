import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/customers/[id]/documents/[documentId]">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, documentId } = await ctx.params;
  const document = await prisma.document.findFirst({
    where: { id: documentId, customerId: id, customer: { agencyId: user.agencyId } },
  });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.document.delete({ where: { id: documentId } });
  await del(document.fileUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
