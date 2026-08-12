import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanSquare, Trophy, TrendingUp, DollarSign } from "lucide-react";

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

  const STATS = [
    { label: "Open leads", value: openLeads, icon: KanbanSquare, tone: "sky" as const },
    { label: "Won", value: wonLeads, icon: Trophy, tone: "emerald" as const },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, tone: "violet" as const },
    {
      label: "Revenue booked",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      tone: "amber" as const,
    },
  ];

  const TONE_BG: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">A quick pulse on the pipeline and your team.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE_BG[tone]}`}>
              <Icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
            <p className="text-xs text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-teal-700 to-emerald-800 p-5 text-white shadow-sm">
        <p className="text-xs font-medium text-teal-100">Open pipeline value</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          ${pipelineValue.toLocaleString()}
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-stone-900">Agent performance</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-medium uppercase tracking-wide text-stone-400">
            <tr>
              <th className="pb-2">Agent</th>
              <th className="pb-2">Leads</th>
              <th className="pb-2">Won</th>
              <th className="pb-2">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {agentStats.map(({ agent, leadCount, won, revenue }) => (
              <tr key={agent.id}>
                <td className="py-2.5 font-medium text-stone-900">{agent.name}</td>
                <td className="py-2.5 text-stone-600">{leadCount}</td>
                <td className="py-2.5 text-stone-600">{won}</td>
                <td className="py-2.5 text-stone-600">${revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
