import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConversationStatus, hasFollowUpDueToday } from "@/lib/conversationStatus";
import { ConversationList } from "@/components/ConversationList";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: { agencyId: user.agencyId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          quotations: { select: { status: true, createdAt: true } },
          bookings: { include: { payments: { select: { amount: true, status: true } } } },
          followUps: { select: { dueAt: true, status: true } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const items = conversations.map((c) => ({
    id: c.id,
    customerName: c.customer.name,
    lastMessageAt: c.lastMessageAt.toISOString(),
    lastMessageBody: c.messages[0]?.body ?? "No messages yet",
    status: getConversationStatus(c),
    followUpToday: hasFollowUpDueToday(c.leads[0]?.followUps ?? []),
  }));

  return (
    <div className="flex h-full">
      <ConversationList items={items} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
