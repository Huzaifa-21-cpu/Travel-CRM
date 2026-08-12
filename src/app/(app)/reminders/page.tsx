import Link from "next/link";
import { format } from "date-fns";
import { Flame } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getExpiringDocuments, getStaleLeads, getDueFollowUps } from "@/lib/reminders";
import { Badge, URGENCY_TONES, URGENCY_DOTS } from "@/components/ui/Badge";

export default async function RemindersPage() {
  const user = await requireUser();
  const [expiring, staleLeads, dueFollowUps] = await Promise.all([
    getExpiringDocuments(user.agencyId),
    getStaleLeads(user.agencyId),
    getDueFollowUps(user.agencyId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Reminders</h1>
        {dueFollowUps.length > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-orange-600">
            <Flame size={15} />
            {dueFollowUps.length} follow-up{dueFollowUps.length === 1 ? "" : "s"} due today
          </p>
        )}
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-stone-900">Due follow-ups</h2>
        {dueFollowUps.length === 0 && <p className="text-xs text-stone-400">Nothing due right now.</p>}
        <ul className="space-y-2">
          {dueFollowUps.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-sm">
              <div>
                <Link href={`/leads/${f.leadId}`} className="font-medium text-stone-900 hover:text-teal-700 hover:underline">
                  {f.lead.customer.name}
                </Link>
                <p className="text-xs text-stone-500">{f.message || f.type}</p>
              </div>
              <span className="text-xs text-amber-600">{format(f.dueAt, "MMM d, HH:mm")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-stone-900">Passport &amp; visa expiry</h2>
        {expiring.length === 0 && (
          <p className="text-xs text-stone-400">No documents expiring in the next 6 months.</p>
        )}
        <ul className="space-y-2.5">
          {expiring.map(({ customer, passportExpiring, visaExpiring, passportUrgency, visaUrgency }) => (
            <li key={customer.id} className="flex items-center justify-between text-sm">
              <Link href={`/customers/${customer.id}`} className="font-medium text-stone-900 hover:text-teal-700 hover:underline">
                {customer.name}
              </Link>
              <div className="flex items-center gap-2">
                {passportExpiring && customer.passportExpiry && passportUrgency && (
                  <Badge tone={URGENCY_TONES[passportUrgency]}>
                    {URGENCY_DOTS[passportUrgency]} Passport {format(customer.passportExpiry, "MMM d")}
                  </Badge>
                )}
                {visaExpiring && customer.visaExpiry && visaUrgency && (
                  <Badge tone={URGENCY_TONES[visaUrgency]}>
                    {URGENCY_DOTS[visaUrgency]} Visa {format(customer.visaExpiry, "MMM d")}
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-stone-900">Stale leads (no update in 3+ days)</h2>
        {staleLeads.length === 0 && <p className="text-xs text-stone-400">All leads are being actively worked.</p>}
        <ul className="space-y-2">
          {staleLeads.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between text-sm">
              <Link href={`/leads/${lead.id}`} className="font-medium text-stone-900 hover:text-teal-700 hover:underline">
                {lead.customer.name} · {lead.title}
              </Link>
              <span className="text-xs text-stone-400">{lead.stage}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
