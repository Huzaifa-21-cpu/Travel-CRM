import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const agency = await prisma.agency.upsert({
    where: { id: "demo-agency" },
    update: {},
    create: { id: "demo-agency", name: "Demo Travel Agency" },
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@demoagency.com" },
    update: {},
    create: {
      agencyId: agency.id,
      name: "Amina Yusuf",
      email: "owner@demoagency.com",
      passwordHash,
      role: "OWNER",
    },
  });
  const agent = await prisma.user.upsert({
    where: { email: "agent@demoagency.com" },
    update: {},
    create: {
      agencyId: agency.id,
      name: "Farhan Malik",
      email: "agent@demoagency.com",
      passwordHash,
      role: "AGENT",
    },
  });

  const customers = await Promise.all(
    [
      {
        name: "Sara Khan",
        phone: "14155550101",
        passportExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        visaCountry: "UAE",
        visaExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      },
      { name: "David Lee", phone: "14155550102" },
      { name: "Priya Nair", phone: "14155550103" },
    ].map((c) =>
      prisma.customer.upsert({
        where: { agencyId_phone: { agencyId: agency.id, phone: c.phone } },
        update: {},
        create: { agencyId: agency.id, ...c },
      })
    )
  );

  const [sara, david, priya] = customers;

  const conversation = await prisma.conversation.create({
    data: {
      agencyId: agency.id,
      customerId: sara.id,
      assignedAgentId: agent.id,
      messages: {
        create: [
          { direction: "INBOUND", senderType: "CUSTOMER", body: "Hi, do you have Bali packages for 4 people in October?" },
          { direction: "OUTBOUND", senderType: "AGENT", body: "Hi Sara! Yes, let me put together a quote for you." },
        ],
      },
    },
  });

  const leadSara = await prisma.lead.create({
    data: {
      agencyId: agency.id,
      customerId: sara.id,
      conversationId: conversation.id,
      agentId: agent.id,
      title: "Bali family trip",
      destination: "Bali, Indonesia",
      pax: 4,
      budget: 6000,
      stage: "QUOTED",
      source: "WHATSAPP",
    },
  });

  await prisma.quotation.create({
    data: {
      leadId: leadSara.id,
      agentId: agent.id,
      version: 1,
      currency: "USD",
      subtotal: 5400,
      tax: 0,
      total: 5400,
      status: "SENT",
      items: {
        create: [
          { description: "Round-trip flights x4", category: "FLIGHT", quantity: 4, unitPrice: 900, amount: 3600 },
          { description: "5 nights villa", category: "HOTEL", quantity: 1, unitPrice: 1800, amount: 1800 },
        ],
      },
    },
  });

  await prisma.lead.create({
    data: {
      agencyId: agency.id,
      customerId: david.id,
      agentId: owner.id,
      title: "Solo Japan trip",
      destination: "Tokyo, Japan",
      pax: 1,
      budget: 3000,
      stage: "NEW",
      source: "WHATSAPP",
    },
  });

  const wonLead = await prisma.lead.create({
    data: {
      agencyId: agency.id,
      customerId: priya.id,
      agentId: agent.id,
      title: "Honeymoon in Maldives",
      destination: "Maldives",
      pax: 2,
      budget: 8000,
      stage: "WON",
      source: "REFERRAL",
    },
  });

  const wonQuote = await prisma.quotation.create({
    data: {
      leadId: wonLead.id,
      agentId: agent.id,
      version: 1,
      currency: "USD",
      subtotal: 7500,
      tax: 0,
      total: 7500,
      status: "ACCEPTED",
      items: {
        create: [{ description: "Overwater villa package", category: "OTHER", quantity: 1, unitPrice: 7500, amount: 7500 }],
      },
    },
  });

  const booking = await prisma.booking.create({
    data: {
      agencyId: agency.id,
      leadId: wonLead.id,
      quotationId: wonQuote.id,
      customerId: priya.id,
      bookingRef: "BK-DEMO1",
      status: "CONFIRMED",
      totalAmount: 7500,
    },
  });

  await prisma.payment.create({
    data: { bookingId: booking.id, amount: 3000, method: "BANK_TRANSFER", status: "PAID", paidAt: new Date() },
  });

  console.log("Seed complete. Login with owner@demoagency.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
