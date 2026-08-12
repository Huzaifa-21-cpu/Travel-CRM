import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: { agencyId: user.agencyId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-sm font-semibold text-slate-900">Inbox</h1>
          <p className="text-xs text-slate-500">{conversations.length} conversations</p>
        </div>
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-slate-400">
            No conversations yet. Inbound WhatsApp messages will show up here automatically.
          </p>
        )}
        <ul>
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/inbox/${c.id}`}
                className="block border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{c.customer.name}</span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(c.lastMessageAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {c.messages[0]?.body ?? "No messages yet"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
