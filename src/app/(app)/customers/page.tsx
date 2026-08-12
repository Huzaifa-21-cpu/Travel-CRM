import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { EXPIRY_WARNING_DAYS } from "@/lib/constants";

export default async function CustomersPage(props: PageProps<"/customers">) {
  const { q } = await props.searchParams;
  const user = await requireUser();
  const query = typeof q === "string" ? q : "";

  const customers = await prisma.customer.findMany({
    where: {
      agencyId: user.agencyId,
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  const cutoff = addDays(new Date(), EXPIRY_WARNING_DAYS);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Customers</h1>
          <p className="text-xs text-stone-500">{customers.length} total</p>
        </div>
        <Link
          href="/customers/new"
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800"
        >
          + New customer
        </Link>
      </div>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, phone, or email..."
          className="w-80 rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </form>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Passport expiry</th>
              <th className="px-4 py-2">Visa expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {customers.map((c) => {
              const passportSoon = c.passportExpiry && c.passportExpiry <= cutoff;
              const visaSoon = c.visaExpiry && c.visaExpiry <= cutoff;
              return (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/customers/${c.id}`} className="font-medium text-stone-900 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">{c.phone}</td>
                  <td className={`px-4 py-2.5 ${passportSoon ? "font-medium text-rose-600" : "text-stone-600"}`}>
                    {c.passportExpiry ? c.passportExpiry.toDateString() : "—"}
                  </td>
                  <td className={`px-4 py-2.5 ${visaSoon ? "font-medium text-rose-600" : "text-stone-600"}`}>
                    {c.visaExpiry ? c.visaExpiry.toDateString() : "—"}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-stone-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
