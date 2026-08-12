import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1),
  relationship: z.string().optional(),
  dob: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
});

export async function POST(req: NextRequest, ctx: RouteContext<"/api/customers/[id]/family">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const customer = await prisma.customer.findFirst({ where: { id, agencyId: user.agencyId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const member = await prisma.familyMember.create({
    data: {
      customerId: customer.id,
      name: d.name,
      relationship: d.relationship || undefined,
      dob: d.dob ? new Date(d.dob) : undefined,
      passportNumber: d.passportNumber || undefined,
      passportExpiry: d.passportExpiry ? new Date(d.passportExpiry) : undefined,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}
