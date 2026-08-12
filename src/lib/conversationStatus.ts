export const CONVERSATION_STATUSES = [
  "NEW_ENQUIRY",
  "AWAITING_CUSTOMER",
  "QUOTATION_SENT",
  "PAYMENT_PENDING",
  "BOOKING_CONFIRMED",
] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  NEW_ENQUIRY: "New Enquiry",
  AWAITING_CUSTOMER: "Awaiting Customer",
  QUOTATION_SENT: "Quotation Sent",
  PAYMENT_PENDING: "Payment Pending",
  BOOKING_CONFIRMED: "Booking Confirmed",
};

type Payment = { amount: number; status: string };
type Booking = { status: string; totalAmount: number; payments: Payment[] };
type Quotation = { status: string; createdAt: Date };
type Lead = { stage: string; quotations: Quotation[]; bookings: Booking[] };
type FollowUp = { dueAt: Date; status: string };
type ConversationInput = {
  leads: Lead[];
  // Expected most-recent-first (i.e. fetched with orderBy: createdAt desc).
  messages: { direction: string; createdAt: Date }[];
};

/**
 * Derives a single workflow bucket per conversation from its linked lead,
 * quotations, bookings, and payments — no separate status field to keep in
 * sync. Priority order: furthest-along state wins.
 */
export function getConversationStatus(conversation: ConversationInput): ConversationStatus {
  const lead = conversation.leads[0];
  if (!lead) return "NEW_ENQUIRY";

  const hasConfirmedBooking = lead.bookings.some((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  if (hasConfirmedBooking) {
    const hasOutstandingBalance = lead.bookings.some((b) => {
      const paid = b.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
      return paid < b.totalAmount;
    });
    if (hasOutstandingBalance) return "PAYMENT_PENDING";
    return "BOOKING_CONFIRMED";
  }

  const latestQuotation = [...lead.quotations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (latestQuotation && ["SENT", "VIEWED", "NEGOTIATING", "ACCEPTED"].includes(latestQuotation.status)) {
    return "QUOTATION_SENT";
  }

  const lastMessage = conversation.messages[0];
  if (lastMessage?.direction === "OUTBOUND" && lead.stage !== "NEW") {
    return "AWAITING_CUSTOMER";
  }

  return "NEW_ENQUIRY";
}

export function hasFollowUpDueToday(followUps: FollowUp[]): boolean {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return followUps.some((f) => f.status === "PENDING" && f.dueAt <= endOfToday);
}
