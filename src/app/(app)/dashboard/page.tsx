import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();

  const [leads, bookings, users] = await Promise.all([
    prisma.lead.findMany({ where: { agencyId: user.agencyId } }),
    prisma.booking.findMany({ where: { agencyId: user.agencyId } }),
    prisma.user.findMany({ where: { agencyId: user.agencyId } }),
  ]);

  const totalRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const wonLeads = leads.filter((l) => l.stage === "WON").length;
  const openLeads = leads.filter((l) => !["WON", "LOST"].includes(l.stage)).length;
  const conversionRate = leads.length ? Math.round((wonLeads / leads.length) * 100) : 0;
  const pipelineValue = leads
    .filter((l) => !["WON", "LOST"].includes(l.stage))
    .reduce((s, l) => s + (l.budget ?? 0), 0);

  const agentStats = users.map((agent) => {
    const agentLeads = leads.filter((l) => l.agentId === agent.id);
    const agentWon = agentLeads.filter((l) => l.stage === "WON").length;
    const agentRevenue = bookings
      .filter((b) => agentLeads.some((l) => l.id === b.leadId))
      .reduce((s, b) => s + b.totalAmount, 0);
    return { agent, leadCount: agentLeads.length, won: agentWon, revenue: agentRevenue };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open leads", value: openLeads },
          { label: "Won", value: wonLeads },
          { label: "Conversion", value: `${conversionRate}%` },
          { label: "Revenue booked", value: `$${totalRevenue.toLocaleString()}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-400">Open pipeline value</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">${pipelineValue.toLocaleString()}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Agent performance</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2">Agent</th>
              <th className="pb-2">Leads</th>
              <th className="pb-2">Won</th>
              <th className="pb-2">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agentStats.map(({ agent, leadCount, won, revenue }) => (
              <tr key={agent.id}>
                <td className="py-2 font-medium text-slate-900">{agent.name}</td>
                <td className="py-2 text-slate-600">{leadCount}</td>
                <td className="py-2 text-slate-600">{won}</td>
                <td className="py-2 text-slate-600">${revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
