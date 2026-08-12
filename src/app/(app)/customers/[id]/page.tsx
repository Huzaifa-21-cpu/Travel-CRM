import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { MessageCircle, Briefcase, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerDetailsForm } from "@/components/CustomerDetailsForm";
import { DocumentsSection } from "@/components/DocumentsSection";
import { FamilyMembersSection } from "@/components/FamilyMembersSection";
import { isBlobConfigured } from "@/lib/blob";
import { Badge, STAGE_TONES } from "@/components/ui/Badge";
import { LEAD_STAGE_LABELS } from "@/lib/constants";

export default async function CustomerDetailPage(props: PageProps<"/customers/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();

  const customer = await prisma.customer.findFirst({
    where: { id, agencyId: user.agencyId },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: { quotations: { orderBy: { createdAt: "desc" } } },
      },
      bookings: { orderBy: { createdAt: "desc" } },
      conversations: { orderBy: { lastMessageAt: "desc" }, take: 1 },
      documents: { orderBy: { uploadedAt: "desc" } },
      familyMembers: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!customer) notFound();

  const quotations = customer.leads.flatMap((l) => l.quotations.map((q) => ({ ...q, leadTitle: l.title, leadId: l.id })));

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">{customer.name}</h1>
          <p className="text-xs text-stone-500">{customer.phone}</p>
        </div>
        {customer.conversations[0] && (
          <Link
            href={`/inbox/${customer.conversations[0].id}`}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <MessageCircle size={13} />
            View WhatsApp thread
          </Link>
        )}
      </div>

      <CustomerDetailsForm
        customerId={customer.id}
        initial={{
          name: customer.name,
          email: customer.email ?? "",
          passportNumber: customer.passportNumber ?? "",
          passportExpiry: customer.passportExpiry ? format(customer.passportExpiry, "yyyy-MM-dd") : "",
          visaCountry: customer.visaCountry ?? "",
          visaExpiry: customer.visaExpiry ? format(customer.visaExpiry, "yyyy-MM-dd") : "",
          notes: customer.notes ?? "",
        }}
      />

      <FamilyMembersSection
        customerId={customer.id}
        members={customer.familyMembers.map((m) => ({
          ...m,
          passportExpiry: m.passportExpiry ? m.passportExpiry.toISOString() : null,
        }))}
      />

      <DocumentsSection
        customerId={customer.id}
        documents={customer.documents.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() }))}
        blobConfigured={isBlobConfigured()}
      />

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-stone-900">Leads</h2>
        {customer.leads.length === 0 && <p className="text-xs text-stone-400">No leads yet.</p>}
        <ul className="space-y-1.5">
          {customer.leads.map((l) => (
            <li key={l.id} className="flex items-center justify-between text-sm">
              <Link href={`/leads/${l.id}`} className="text-stone-900 hover:text-teal-700 hover:underline">
                {l.title}
              </Link>
              <Badge tone={STAGE_TONES[l.stage] ?? "stone"}>{LEAD_STAGE_LABELS[l.stage as keyof typeof LEAD_STAGE_LABELS] ?? l.stage}</Badge>
            </li>
          ))}
        </ul>
      </div>

      {quotations.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <FileText size={15} className="text-teal-600" />
            Quotations
          </h2>
          <ul className="space-y-1.5">
            {quotations.map((q) => (
              <li key={q.id} className="flex items-center justify-between text-sm">
                <Link href={`/leads/${q.leadId}`} className="text-stone-900 hover:text-teal-700 hover:underline">
                  {q.leadTitle} · v{q.version}
                </Link>
                <span className="text-xs text-stone-400">
                  {q.status} · {q.currency} {q.total.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {customer.bookings.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Briefcase size={15} className="text-teal-600" />
            Travel history
          </h2>
          <ul className="space-y-1.5">
            {customer.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <Link href={`/bookings/${b.id}`} className="text-stone-900 hover:text-teal-700 hover:underline">
                  {b.bookingRef}
                </Link>
                <span className="text-xs text-stone-400">
                  {b.status}
                  {b.travelStartDate ? ` · ${format(b.travelStartDate, "MMM yyyy")}` : ""} · $
                  {b.totalAmount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
