"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Flame } from "lucide-react";
import { clsx } from "clsx";
import { avatarTone } from "@/lib/avatar";
import { CONVERSATION_STATUSES, CONVERSATION_STATUS_LABELS, type ConversationStatus } from "@/lib/conversationStatus";
import { Badge, CONVERSATION_STATUS_TONES } from "@/components/ui/Badge";

type Item = {
  id: string;
  customerName: string;
  lastMessageAt: string;
  lastMessageBody: string;
  status: ConversationStatus;
  followUpToday: boolean;
};

type Filter = "ALL" | "FOLLOW_UP_TODAY" | ConversationStatus;

export function ConversationList({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts: Record<Filter, number> = {
    ALL: items.length,
    FOLLOW_UP_TODAY: items.filter((i) => i.followUpToday).length,
    NEW_ENQUIRY: 0,
    AWAITING_CUSTOMER: 0,
    QUOTATION_SENT: 0,
    PAYMENT_PENDING: 0,
    BOOKING_CONFIRMED: 0,
  };
  for (const s of CONVERSATION_STATUSES) counts[s] = items.filter((i) => i.status === s).length;

  const filtered = items.filter((i) => {
    if (filter === "ALL") return true;
    if (filter === "FOLLOW_UP_TODAY") return i.followUpToday;
    return i.status === filter;
  });

  const TABS: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "NEW_ENQUIRY", label: CONVERSATION_STATUS_LABELS.NEW_ENQUIRY },
    { key: "AWAITING_CUSTOMER", label: CONVERSATION_STATUS_LABELS.AWAITING_CUSTOMER },
    { key: "QUOTATION_SENT", label: CONVERSATION_STATUS_LABELS.QUOTATION_SENT },
    { key: "PAYMENT_PENDING", label: CONVERSATION_STATUS_LABELS.PAYMENT_PENDING },
    { key: "BOOKING_CONFIRMED", label: CONVERSATION_STATUS_LABELS.BOOKING_CONFIRMED },
    { key: "FOLLOW_UP_TODAY", label: "Follow-up Today" },
  ];

  return (
    <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-3.5">
        <h1 className="text-sm font-semibold text-stone-900">Inbox</h1>
        <p className="text-xs text-stone-500">{items.length} conversations</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-stone-200 px-3 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              filter === tab.key
                ? "bg-teal-700 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && <span className="ml-1 opacity-80">{counts[tab.key]}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-stone-400">
            {items.length === 0
              ? "No conversations yet. Inbound WhatsApp messages will show up here automatically."
              : "No conversations match this filter."}
          </p>
        )}
        <ul>
          {filtered.map((c) => {
            const tone = avatarTone(c.customerName);
            const active = pathname === `/inbox/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/inbox/${c.id}`}
                  className={clsx(
                    "flex items-start gap-3 border-b border-stone-100 px-4 py-3 transition-colors hover:bg-stone-50",
                    active && "bg-teal-50/60",
                  )}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tone}`}
                  >
                    {c.customerName.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-stone-900">{c.customerName}</span>
                      <span className="shrink-0 text-[11px] text-stone-400">
                        {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">{c.lastMessageBody}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge tone={CONVERSATION_STATUS_TONES[c.status]}>
                        {CONVERSATION_STATUS_LABELS[c.status]}
                      </Badge>
                      {c.followUpToday && (
                        <span title="Follow-up due today" className="text-orange-500">
                          <Flame size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
