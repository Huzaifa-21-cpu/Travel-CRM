import { addDays, differenceInCalendarDays } from "date-fns";
import { prisma } from "./prisma";
import { EXPIRY_WARNING_DAYS, STALE_LEAD_DAYS, EXPIRY_URGENCY_TIERS, type ExpiryUrgency } from "./constants";

/** Which staged urgency bucket a date falls into, relative to today. */
export function getExpiryUrgency(date: Date): ExpiryUrgency {
  const daysLeft = differenceInCalendarDays(date, new Date());
  for (const tier of EXPIRY_URGENCY_TIERS) {
    if (daysLeft <= tier.maxDays) return tier.key;
  }
  return "OK";
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
  UPCOMING: 3,
  PLAN_AHEAD: 4,
  OK: 5,
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
