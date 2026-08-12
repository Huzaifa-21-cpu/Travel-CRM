import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { isAiConfigured } from "@/lib/ai";
import { ReplyBox } from "@/components/ReplyBox";

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{conversation.customer.name}</p>
          <p className="text-xs text-slate-500">{conversation.customer.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/customers/${conversation.customer.id}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View customer
          </Link>
          {activeLead ? (
            <Link
              href={`/leads/${activeLead.id}`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              View lead
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-md rounded-lg px-3 py-2 text-sm ${
                m.direction === "OUTBOUND"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 border border-slate-200"
              }`}
            >
              <p>{m.body}</p>
              <p
                className={`mt-1 text-[10px] ${
                  m.direction === "OUTBOUND" ? "text-slate-300" : "text-slate-400"
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
