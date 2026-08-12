import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/constants";
import { StageSelect } from "@/components/StageSelect";

export default async function LeadsPage() {
  const user = await requireUser();

  const leads = await prisma.lead.findMany({
    where: { agencyId: user.agencyId },
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });

  const byStage = Object.fromEntries(LEAD_STAGES.map((s) => [s, leads.filter((l) => l.stage === s)]));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Pipeline</h1>
          <p className="text-xs text-slate-500">{leads.length} leads</p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          + New lead
        </Link>
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {LEAD_STAGES.map((stage) => (
          <div key={stage} className="flex w-64 shrink-0 flex-col rounded-lg bg-slate-100">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="text-xs font-semibold text-slate-700">{LEAD_STAGE_LABELS[stage]}</h2>
              <span className="text-[10px] text-slate-400">{byStage[stage].length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {byStage[stage].map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block rounded-md border border-slate-200 bg-white p-2.5 shadow-sm hover:border-slate-300"
                >
                  <p className="text-xs font-medium text-slate-900">{lead.customer.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {lead.destination ?? lead.title}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatDistanceToNow(lead.updatedAt, { addSuffix: true })}</span>
                    {lead.budget ? <span>${lead.budget.toLocaleString()}</span> : null}
                  </div>
                  <StageSelect leadId={lead.id} stage={lead.stage} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
