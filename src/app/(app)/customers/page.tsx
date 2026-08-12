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
          <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
          <p className="text-xs text-slate-500">{customers.length} total</p>
        </div>
        <Link
          href="/customers/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
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
          className="w-80 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Passport expiry</th>
              <th className="px-4 py-2">Visa expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => {
              const passportSoon = c.passportExpiry && c.passportExpiry <= cutoff;
              const visaSoon = c.visaExpiry && c.visaExpiry <= cutoff;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/customers/${c.id}`} className="font-medium text-slate-900 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{c.phone}</td>
                  <td className={`px-4 py-2.5 ${passportSoon ? "font-medium text-red-600" : "text-slate-600"}`}>
                    {c.passportExpiry ? c.passportExpiry.toDateString() : "—"}
                  </td>
                  <td className={`px-4 py-2.5 ${visaSoon ? "font-medium text-red-600" : "text-slate-600"}`}>
                    {c.visaExpiry ? c.visaExpiry.toDateString() : "—"}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
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
