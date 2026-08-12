import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ customers });
}

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  visaCountry: z.string().optional(),
  visaExpiry: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const customer = await prisma.customer.create({
    data: {
      agencyId: user.agencyId,
      name: d.name,
      phone: d.phone,
      email: d.email || undefined,
      passportNumber: d.passportNumber || undefined,
      passportExpiry: d.passportExpiry ? new Date(d.passportExpiry) : undefined,
      visaCountry: d.visaCountry || undefined,
      visaExpiry: d.visaExpiry ? new Date(d.visaExpiry) : undefined,
      notes: d.notes || undefined,
    },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
