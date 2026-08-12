export const LEAD_STAGES = [
  "NEW",
  "QUALIFIED",
  "QUOTED",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New Inquiry",
  QUALIFIED: "Qualified",
  QUOTED: "Quoted",
  NEGOTIATION: "Negotiation",
  WON: "Won / Booked",
  LOST: "Lost",
};

export const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "NEGOTIATING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

export const QUOTATION_ITEM_CATEGORIES = [
  "FLIGHT",
  "HOTEL",
  "VISA",
  "TRANSPORT",
  "ACTIVITY",
  "OTHER",
] as const;

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "ONLINE",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "PARTIAL",
  "REFUNDED",
] as const;

export const FOLLOW_UP_TYPES = [
  "FOLLOW_UP",
  "PASSPORT_REMINDER",
  "VISA_REMINDER",
] as const;

export const FOLLOW_UP_STATUSES = ["PENDING", "SENT", "DONE", "CANCELLED"] as const;

// Documents/leads expiring within this window surface as reminders.
export const EXPIRY_WARNING_DAYS = 180;
// Leads with no activity for this long surface as stale-follow-up reminders.
export const STALE_LEAD_DAYS = 3;

// Staged urgency thresholds (days-until-expiry) for passport/visa reminders,
// checked in order — first match wins.
export const EXPIRY_URGENCY_TIERS = [
  { maxDays: 0, key: "EXPIRED", label: "Expired" },
  { maxDays: 3, key: "URGENT", label: "3 days" },
  { maxDays: 7, key: "SOON", label: "7 days" },
  { maxDays: 15, key: "UPCOMING", label: "15 days" },
  { maxDays: 30, key: "PLAN_AHEAD", label: "30 days" },
] as const;
export type ExpiryUrgency = (typeof EXPIRY_URGENCY_TIERS)[number]["key"] | "OK";

export const DOCUMENT_TYPES = [
  "PASSPORT",
  "VISA",
  "EMIRATES_ID",
  "NATIONAL_ID",
  "INSURANCE",
  "PHOTO",
  "OTHER",
] as const;

export const FAMILY_RELATIONSHIPS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Other",
] as const;
