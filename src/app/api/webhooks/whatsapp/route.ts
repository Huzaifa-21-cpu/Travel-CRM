import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractInboundMessages, type WhatsAppWebhookPayload } from "@/lib/whatsapp";

// Meta calls this once when you configure the webhook URL in the Meta App dashboard.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Meta POSTs here for every inbound message / status update.
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as WhatsAppWebhookPayload | null;
  if (!payload) return NextResponse.json({ ok: true });

  const messages = extractInboundMessages(payload);

  for (const msg of messages) {
    let agency = msg.phoneNumberId
      ? await prisma.agency.findUnique({ where: { whatsappPhoneNumberId: msg.phoneNumberId } })
      : null;

    // Single-tenant dev/demo fallback: with only one agency in the whole system and no
    // whatsappPhoneNumberId configured yet, route everything to it. Once a second agency
    // exists this fallback stops firing, so unmatched messages are dropped instead of
    // risking cross-tenant misrouting.
    if (!agency) {
      const agencyCount = await prisma.agency.count();
      if (agencyCount === 1) agency = await prisma.agency.findFirst();
    }
    if (!agency) continue;

    const customer = await prisma.customer.upsert({
      where: { agencyId_phone: { agencyId: agency.id, phone: msg.from } },
      update: msg.name ? { name: msg.name } : {},
      create: { agencyId: agency.id, name: msg.name ?? msg.from, phone: msg.from },
    });

    let conversation = await prisma.conversation.findFirst({
      where: { agencyId: agency.id, customerId: customer.id, status: "OPEN" },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { agencyId: agency.id, customerId: customer.id },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        senderType: "CUSTOMER",
        waMessageId: msg.waMessageId,
        body: msg.body,
      },
    });

    const existingLead = await prisma.lead.findFirst({
      where: { customerId: customer.id, stage: { notIn: ["WON", "LOST"] } },
    });
    if (!existingLead) {
      await prisma.lead.create({
        data: {
          agencyId: agency.id,
          customerId: customer.id,
          conversationId: conversation.id,
          title: `Inquiry from ${customer.name}`,
          stage: "NEW",
          source: "WHATSAPP",
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
