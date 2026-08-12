const GRAPH_API_VERSION = "v21.0";

export class WhatsAppNotConfiguredError extends Error {
  constructor() {
    super("WhatsApp credentials are not configured (set WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID in .env)");
    this.name = "WhatsAppNotConfiguredError";
  }
}

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Sends a free-form text message via the Meta WhatsApp Cloud API. */
export async function sendWhatsAppTextMessage(toPhone: string, body: string) {
  if (!isWhatsAppConfigured()) throw new WhatsAppNotConfiguredError();

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhone,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<{ messages?: { id: string }[] }>;
}

// --- Shapes for parsing Meta's webhook payload ---

export type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
};

export type InboundMessage = {
  phoneNumberId?: string;
  from: string;
  name?: string;
  waMessageId: string;
  body: string;
};

export function extractInboundMessages(payload: WhatsAppWebhookPayload): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      const contact = value.contacts?.[0];
      for (const msg of value.messages) {
        out.push({
          phoneNumberId: value.metadata?.phone_number_id,
          from: msg.from,
          name: contact?.profile?.name,
          waMessageId: msg.id,
          body: msg.text?.body ?? `[unsupported message type: ${msg.type}]`,
        });
      }
    }
  }
  return out;
}
