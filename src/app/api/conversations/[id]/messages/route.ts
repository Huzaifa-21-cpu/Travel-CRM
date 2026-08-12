import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isWhatsAppConfigured, sendWhatsAppTextMessage } from "@/lib/whatsapp";

const schema = z.object({ body: z.string().min(1) });

export async function POST(req: NextRequest, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const conversation = await prisma.conversation.findFirst({
    where: { id, agencyId: user.agencyId },
    include: { customer: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let status = "SENT";
  let waMessageId: string | undefined;

  if (isWhatsAppConfigured()) {
    try {
      const result = await sendWhatsAppTextMessage(conversation.customer.phone, parsed.data.body);
      waMessageId = result.messages?.[0]?.id;
    } catch (err) {
      status = "FAILED";
      console.error("WhatsApp send failed:", err);
    }
  } else {
    // No WhatsApp credentials configured yet — message is recorded but not actually delivered.
    status = "FAILED";
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      senderType: "AGENT",
      body: parsed.data.body,
      waMessageId,
      status,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ message, whatsappConfigured: isWhatsAppConfigured() });
}
