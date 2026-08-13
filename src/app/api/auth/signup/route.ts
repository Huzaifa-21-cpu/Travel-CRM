import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/plans";

const schema = z.object({
  agencyName: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the highlighted fields and try again" }, { status: 400 });
  }
  const { agencyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const { agency, user } = await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: {
        name: agencyName,
        plan: "TRIAL",
        subscriptionStatus: "trialing",
        trialEndsAt: addDays(new Date(), TRIAL_DAYS),
      },
    });
    const user = await tx.user.create({
      data: { agencyId: agency.id, name, email, passwordHash, role: "OWNER" },
    });
    return { agency, user };
  });

  await createSession({
    userId: user.id,
    agencyId: agency.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return NextResponse.json({ ok: true });
}
