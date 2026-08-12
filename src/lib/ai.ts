import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export type ConversationTurn = { direction: string; body: string };

export async function draftReply(params: {
  agencyName: string;
  knowledgeBase: string | null;
  customerName: string;
  history: ConversationTurn[];
}) {
  const { agencyName, knowledgeBase, customerName, history } = params;

  const transcript = history
    .map((m) => `${m.direction === "INBOUND" ? customerName : "Agent"}: ${m.body}`)
    .join("\n");

  const system = [
    `You draft WhatsApp replies on behalf of ${agencyName}, a travel agency, for a human agent to review before sending.`,
    knowledgeBase
      ? `Agency knowledge base (destinations, policies, pricing, hours, visa turnaround, etc.):\n${knowledgeBase}`
      : `No agency knowledge base has been configured yet — keep the reply general and avoid inventing specific prices, dates, or policies.`,
    `Write only the message text the agent should send, in a warm, concise, professional tone. No greeting like "Dear customer", no signature, no explanation of what you're doing — just the reply itself. If the question needs information you don't have, say the agent will confirm and follow up rather than guessing.`,
  ].join("\n\n");

  const response = await getClient().messages.create({
    model: "claude-opus-5",
    max_tokens: 512,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system,
    messages: [
      {
        role: "user",
        content: `Conversation so far:\n${transcript}\n\nDraft the agent's next reply.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  return text?.type === "text" ? text.text.trim() : "";
}
