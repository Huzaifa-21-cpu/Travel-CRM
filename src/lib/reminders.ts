import { addDays } from "date-fns";
import { prisma } from "./prisma";
import { EXPIRY_WARNING_DAYS, STALE_LEAD_DAYS, EXPIRY_URGENCY_TIERS, type ExpiryUrgency } from "./constants";

// Expiry dates are date-only fields (parsed as UTC midnight from a plain
// "YYYY-MM-DD" input), so we diff them as UTC calendar days rather than via
// date-fns' local-timezone-based differenceInCalendarDays — otherwise the
// same data can round to a different day count depending on the server's
// timezone (a Windows dev box vs. Vercel's UTC runtime), shifting a document
// in or out of the alert window by a day for no real reason.
function toUtcMidnight(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Live day-count relative to today (UTC calendar days) — recomputed on every call, so it ticks down on its own. */
export function getDaysUntil(date: Date): number {
  return Math.round((toUtcMidnight(date) - toUtcMidnight(new Date())) / 86_400_000);
}

/** Which staged urgency bucket a date falls into, relative to today. */
export function getExpiryUrgency(date: Date): ExpiryUrgency {
  const daysLeft = getDaysUntil(date);
  for (const tier of EXPIRY_URGENCY_TIERS) {
    if (daysLeft <= tier.maxDays) return tier.key;
  }
  return "OK";
}

/** "Expires in 5 days" / "Expires today" / "Expired 2 days ago". */
export function formatDaysUntil(date: Date): string {
  const days = getDaysUntil(date);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

export async function getExpiringDocuments(agencyId: string) {
  const cutoff = addDays(new Date(), EXPIRY_WARNING_DAYS);

  const customers = await prisma.customer.findMany({
    where: {
      agencyId,
      OR: [
        { passportExpiry: { lte: cutoff } },
        { visaExpiry: { lte: cutoff } },
      ],
    },
    orderBy: { passportExpiry: "asc" },
  });

  return customers
    .map((c) => ({
      customer: c,
      passportExpiring: c.passportExpiry ? c.passportExpiry <= cutoff : false,
      visaExpiring: c.visaExpiry ? c.visaExpiry <= cutoff : false,
      passportUrgency: c.passportExpiry ? getExpiryUrgency(c.passportExpiry) : null,
      visaUrgency: c.visaExpiry ? getExpiryUrgency(c.visaExpiry) : null,
    }))
    .sort((a, b) => URGENCY_RANK[a.passportUrgency ?? a.visaUrgency ?? "OK"] - URGENCY_RANK[b.passportUrgency ?? b.visaUrgency ?? "OK"]);
}

const URGENCY_RANK: Record<ExpiryUrgency, number> = {
  EXPIRED: 0,
  URGENT: 1,
  SOON: 2,
  OK: 3,
};

export async function getStaleLeads(agencyId: string) {
  const cutoff = addDays(new Date(), -STALE_LEAD_DAYS);

  return prisma.lead.findMany({
    where: {
      agencyId,
      stage: { notIn: ["WON", "LOST"] },
      updatedAt: { lte: cutoff },
    },
    include: { customer: true, agent: true },
    orderBy: { updatedAt: "asc" },
  });
}

export async function getDueFollowUps(agencyId: string) {
  return prisma.followUp.findMany({
    where: {
      status: "PENDING",
      dueAt: { lte: new Date() },
      lead: { agencyId },
    },
    include: { lead: { include: { customer: true } }, agent: true },
    orderBy: { dueAt: "asc" },
  });
}
