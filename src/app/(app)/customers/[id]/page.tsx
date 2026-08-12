import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerDetailsForm } from "@/components/CustomerDetailsForm";

export default async function CustomerDetailPage(props: PageProps<"/customers/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();

  const customer = await prisma.customer.findFirst({
    where: { id, agencyId: user.agencyId },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      bookings: true,
      conversations: { orderBy: { lastMessageAt: "desc" }, take: 1 },
    },
  });
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{customer.name}</h1>
          <p className="text-xs text-slate-500">{customer.phone}</p>
        </div>
        {customer.conversations[0] && (
          <Link
            href={`/inbox/${customer.conversations[0].id}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
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

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Leads</h2>
        {customer.leads.length === 0 && <p className="text-xs text-slate-400">No leads yet.</p>}
        <ul className="space-y-1.5">
          {customer.leads.map((l) => (
            <li key={l.id} className="flex items-center justify-between text-sm">
              <Link href={`/leads/${l.id}`} className="text-slate-900 hover:underline">
                {l.title}
              </Link>
              <span className="text-xs text-slate-400">{l.stage}</span>
            </li>
          ))}
        </ul>
      </div>

      {customer.bookings.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Bookings</h2>
          <ul className="space-y-1.5">
            {customer.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <Link href={`/bookings/${b.id}`} className="text-slate-900 hover:underline">
                  {b.bookingRef}
                </Link>
                <span className="text-xs text-slate-400">
                  {b.status} · ${b.totalAmount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
