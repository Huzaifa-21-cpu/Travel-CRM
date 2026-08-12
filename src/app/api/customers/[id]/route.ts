import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  visaCountry: z.string().optional(),
  visaExpiry: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await prisma.customer.findFirst({ where: { id, agencyId: user.agencyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: d.name,
      email: d.email || undefined,
      passportNumber: d.passportNumber || undefined,
      passportExpiry: d.passportExpiry ? new Date(d.passportExpiry) : undefined,
      visaCountry: d.visaCountry || undefined,
      visaExpiry: d.visaExpiry ? new Date(d.visaExpiry) : undefined,
      notes: d.notes || undefined,
    },
  });

  return NextResponse.json({ customer });
}
