import Link from "next/link";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { getExpiringDocuments, getStaleLeads, getDueFollowUps } from "@/lib/reminders";

export default async function RemindersPage() {
  const user = await requireUser();
  const [expiring, staleLeads, dueFollowUps] = await Promise.all([
    getExpiringDocuments(user.agencyId),
    getStaleLeads(user.agencyId),
    getDueFollowUps(user.agencyId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-lg font-semibold text-slate-900">Reminders</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Due follow-ups</h2>
        {dueFollowUps.length === 0 && <p className="text-xs text-slate-400">Nothing due right now.</p>}
        <ul className="space-y-2">
          {dueFollowUps.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-sm">
              <div>
                <Link href={`/leads/${f.leadId}`} className="font-medium text-slate-900 hover:underline">
                  {f.lead.customer.name}
                </Link>
                <p className="text-xs text-slate-500">{f.message || f.type}</p>
              </div>
              <span className="text-xs text-amber-600">{format(f.dueAt, "MMM d, HH:mm")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Passport &amp; visa expiring soon</h2>
        {expiring.length === 0 && (
          <p className="text-xs text-slate-400">No documents expiring in the next 6 months.</p>
        )}
        <ul className="space-y-2">
          {expiring.map(({ customer, passportExpiring, visaExpiring }) => (
            <li key={customer.id} className="flex items-center justify-between text-sm">
              <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:underline">
                {customer.name}
              </Link>
              <span className="text-xs text-red-600">
                {passportExpiring && customer.passportExpiry
                  ? `Passport ${format(customer.passportExpiry, "MMM d, yyyy")}`
                  : null}
                {passportExpiring && visaExpiring ? " · " : ""}
                {visaExpiring && customer.visaExpiry
                  ? `Visa ${format(customer.visaExpiry, "MMM d, yyyy")}`
                  : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Stale leads (no update in 3+ days)</h2>
        {staleLeads.length === 0 && <p className="text-xs text-slate-400">All leads are being actively worked.</p>}
        <ul className="space-y-2">
          {staleLeads.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between text-sm">
              <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">
                {lead.customer.name} · {lead.title}
              </Link>
              <span className="text-xs text-slate-400">{lead.stage}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
