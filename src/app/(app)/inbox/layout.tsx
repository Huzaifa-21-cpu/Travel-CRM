import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { avatarTone } from "@/lib/avatar";

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
      <div className="w-80 shrink-0 overflow-y-auto border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3.5">
          <h1 className="text-sm font-semibold text-stone-900">Inbox</h1>
          <p className="text-xs text-stone-500">{conversations.length} conversations</p>
        </div>
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-stone-400">
            No conversations yet. Inbound WhatsApp messages will show up here automatically.
          </p>
        )}
        <ul>
          {conversations.map((c) => {
            const tone = avatarTone(c.customer.name);
            return (
              <li key={c.id}>
                <Link
                  href={`/inbox/${c.id}`}
                  className="flex items-start gap-3 border-b border-stone-100 px-4 py-3 transition-colors hover:bg-stone-50"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tone}`}
                  >
                    {c.customer.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-stone-900">
                        {c.customer.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-stone-400">
                        {formatDistanceToNow(c.lastMessageAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {c.messages[0]?.body ?? "No messages yet"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
