import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentForm } from "@/components/PaymentForm";

export default async function BookingDetailPage(props: PageProps<"/bookings/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();

  const booking = await prisma.booking.findFirst({
    where: { id, agencyId: user.agencyId },
    include: { customer: true, lead: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!booking) notFound();

  const paid = booking.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const balance = booking.totalAmount - paid;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div>
        <p className="text-xs text-slate-500">
          <Link href={`/leads/${booking.leadId}`} className="hover:underline">
            {booking.lead.title}
          </Link>
        </p>
        <h1 className="mt-0.5 text-lg font-semibold text-slate-900">{booking.bookingRef}</h1>
        <p className="text-xs text-slate-500">
          {booking.customer.name} · {booking.customer.phone}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div>
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-slate-900">${booking.totalAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Paid</p>
          <p className="text-emerald-600">${paid.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Balance</p>
          <p className={balance > 0 ? "text-amber-600" : "text-slate-900"}>
            ${balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Payments</h2>
        <PaymentForm bookingId={booking.id} />
        <ul className="mt-3 divide-y divide-slate-100">
          {booking.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700">
                {p.method.replace("_", " ")} {p.notes ? `· ${p.notes}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <span className={p.status === "PAID" ? "text-emerald-600" : "text-amber-600"}>
                  {p.status}
                </span>
                <span className="font-medium text-slate-900">${p.amount.toLocaleString()}</span>
                <span className="text-xs text-slate-400">
                  {p.paidAt ? format(p.paidAt, "MMM d") : format(p.createdAt, "MMM d")}
                </span>
              </span>
            </li>
          ))}
          {booking.payments.length === 0 && (
            <li className="py-2 text-xs text-slate-400">No payments recorded yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
