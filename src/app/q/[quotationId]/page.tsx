import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Plane } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function PublicQuotePage(props: PageProps<"/q/[quotationId]">) {
  const { quotationId } = await props.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      items: true,
      lead: { include: { customer: true, agency: true } },
    },
  });
  if (!quotation) notFound();

  // First open transitions Sent -> Viewed automatically, mirroring the status
  // the agent sees on the lead page — a real read receipt, not a manual toggle.
  if (quotation.status === "SENT") {
    await prisma.quotation.update({ where: { id: quotation.id }, data: { status: "VIEWED" } });
  }

  const { lead } = quotation;
  const isExpired = quotation.validUntil ? quotation.validUntil < new Date() : false;

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
            <Plane size={16} className="-rotate-45 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold text-stone-900">{lead.agency.name}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-teal-700 to-emerald-800 px-6 py-5 text-white">
            <p className="text-xs font-medium text-teal-100">Travel Quotation #{quotation.version}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{lead.title}</h1>
            <p className="mt-1 text-sm text-teal-50/90">
              Prepared for {lead.customer.name}
              {lead.destination ? ` · ${lead.destination}` : ""}
              {lead.pax ? ` · ${lead.pax} pax` : ""}
            </p>
          </div>

          <div className="px-6 py-5">
            {isExpired && (
              <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                This quote expired on {format(quotation.validUntil!, "MMM d, yyyy")}. Contact your agent for a
                refreshed price.
              </p>
            )}

            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-stone-100">
                {quotation.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5">
                      <p className="text-stone-900">{item.description}</p>
                      <p className="text-xs text-stone-400">
                        {item.category.replace("_", " ")} × {item.quantity}
                      </p>
                    </td>
                    <td className="py-2.5 text-right text-stone-700">
                      {quotation.currency} {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-1 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>
                  {quotation.currency} {quotation.subtotal.toLocaleString()}
                </span>
              </div>
              {quotation.tax > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Tax</span>
                  <span>
                    {quotation.currency} {quotation.tax.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-semibold text-stone-900">
                <span>Total</span>
                <span>
                  {quotation.currency} {quotation.total.toLocaleString()}
                </span>
              </div>
            </div>

            {quotation.validUntil && !isExpired && (
              <p className="mt-4 text-xs text-stone-400">
                Valid until {format(quotation.validUntil, "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Questions about this quote? Reply to your WhatsApp conversation with {lead.agency.name}.
        </p>
      </div>
    </div>
  );
}
