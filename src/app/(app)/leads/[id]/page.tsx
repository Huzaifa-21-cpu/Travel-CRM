import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { FileText, Package, BellRing } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StageSelect } from "@/components/StageSelect";
import { NotesEditor } from "@/components/NotesEditor";
import { FollowUpForm } from "@/components/FollowUpForm";
import { CreateBookingButton } from "@/components/CreateBookingButton";
import { QuotationStatusSelect } from "@/components/QuotationStatusSelect";
import { Badge } from "@/components/ui/Badge";

export default async function LeadDetailPage(props: PageProps<"/leads/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();

  const lead = await prisma.lead.findFirst({
    where: { id, agencyId: user.agencyId },
    include: {
      customer: true,
      quotations: { include: { items: true }, orderBy: { createdAt: "desc" } },
      bookings: true,
      followUps: { orderBy: { dueAt: "asc" } },
    },
  });
  if (!lead) notFound();

  const bookedQuotationIds = new Set(lead.bookings.map((b) => b.quotationId));

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-500">
            <Link href="/leads" className="hover:text-teal-700 hover:underline">
              Pipeline
            </Link>{" "}
            / {lead.customer.name}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-stone-900">{lead.title}</h1>
          <p className="text-xs text-stone-500">
            {lead.customer.name} · {lead.customer.phone}
          </p>
        </div>
        <div className="w-40">
          <StageSelect leadId={lead.id} stage={lead.stage} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
        <div>
          <p className="text-xs text-stone-400">Destination</p>
          <p className="text-stone-900">{lead.destination ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Travel date</p>
          <p className="text-stone-900">{lead.travelDate ? format(lead.travelDate, "MMM d, yyyy") : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Pax</p>
          <p className="text-stone-900">{lead.pax ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Budget</p>
          <p className="text-stone-900">{lead.budget ? `$${lead.budget.toLocaleString()}` : "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-stone-900">Notes</h2>
        <NotesEditor leadId={lead.id} initialNotes={lead.notes ?? ""} />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <FileText size={15} className="text-teal-600" />
            Quotations
          </h2>
          <Link
            href={`/leads/${lead.id}/quote`}
            className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            + New quotation
          </Link>
        </div>
        {lead.quotations.length === 0 && (
          <p className="text-xs text-stone-400">No quotations yet.</p>
        )}
        <ul className="space-y-2">
          {lead.quotations.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium text-stone-900">
                  v{q.version} · {q.currency} {q.total.toLocaleString()}
                </p>
                <p className="text-xs text-stone-400">
                  {q.items.length} items
                  {q.agencyCost != null && (
                    <span className="text-emerald-600">
                      {" "}
                      · margin {q.currency} {(q.total - q.agencyCost).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/q/${q.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-700 hover:underline"
                  title="Open the customer-facing quote link"
                >
                  Link
                </a>
                <QuotationStatusSelect quotationId={q.id} status={q.status} />
                {!bookedQuotationIds.has(q.id) && lead.stage !== "WON" && (
                  <CreateBookingButton quotationId={q.id} />
                )}
                {bookedQuotationIds.has(q.id) && <Badge tone="emerald">Booked</Badge>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {lead.bookings.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Package size={15} className="text-teal-600" />
            Bookings
          </h2>
          <ul className="space-y-2">
            {lead.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/bookings/${b.id}`}
                  className="font-medium text-stone-900 hover:text-teal-700 hover:underline"
                >
                  {b.bookingRef}
                </Link>
                <span className="text-xs text-stone-500">
                  {b.status} · ${b.totalAmount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
          <BellRing size={15} className="text-teal-600" />
          Follow-ups
        </h2>
        <FollowUpForm leadId={lead.id} />
        <ul className="mt-3 space-y-1.5">
          {lead.followUps.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-xs">
              <span className="text-stone-700">{f.message || f.type.replace("_", " ")}</span>
              <span className={f.status === "DONE" ? "text-stone-400" : "font-medium text-amber-600"}>
                {format(f.dueAt, "MMM d, HH:mm")} · {f.status}
              </span>
            </li>
          ))}
          {lead.followUps.length === 0 && (
            <li className="text-xs text-stone-400">No follow-ups scheduled.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
