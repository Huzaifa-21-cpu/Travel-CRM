import { addDays } from "date-fns";
import { prisma } from "./prisma";
import { EXPIRY_WARNING_DAYS, STALE_LEAD_DAYS } from "./constants";

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

  return customers.map((c) => ({
    customer: c,
    passportExpiring: c.passportExpiry ? c.passportExpiry <= cutoff : false,
    visaExpiring: c.visaExpiry ? c.visaExpiry <= cutoff : false,
  }));
}

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
