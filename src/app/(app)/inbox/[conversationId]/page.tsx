import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { isAiConfigured } from "@/lib/ai";
import { ReplyBox } from "@/components/ReplyBox";
import { avatarTone } from "@/lib/avatar";

export default async function ConversationPage(
  props: PageProps<"/inbox/[conversationId]">
) {
  const { conversationId } = await props.params;
  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agencyId: user.agencyId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
      leads: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!conversation) notFound();

  const activeLead = conversation.leads[0];
  const tone = avatarTone(conversation.customer.name);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tone}`}
          >
            {conversation.customer.name.trim().charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">{conversation.customer.name}</p>
            <p className="text-xs text-stone-500">{conversation.customer.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/customers/${conversation.customer.id}`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            View customer
          </Link>
          {activeLead ? (
            <Link
              href={`/leads/${activeLead.id}`}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800"
            >
              View lead
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto p-4"
        style={{
          backgroundImage: "radial-gradient(circle, #e7e5e4 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundColor: "#fafaf9",
        }}
      >
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-md rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                m.direction === "OUTBOUND"
                  ? "rounded-br-md bg-teal-700 text-white"
                  : "rounded-bl-md border border-stone-200 bg-white text-stone-900"
              }`}
            >
              <p>{m.body}</p>
              <p
                className={`mt-1 text-[10px] ${
                  m.direction === "OUTBOUND" ? "text-teal-100" : "text-stone-400"
                }`}
              >
                {format(m.createdAt, "MMM d, HH:mm")}
                {m.status === "FAILED" ? " · not delivered" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ReplyBox
        conversationId={conversation.id}
        whatsappConfigured={isWhatsAppConfigured()}
        aiConfigured={isAiConfigured()}
      />
    </div>
  );
}
