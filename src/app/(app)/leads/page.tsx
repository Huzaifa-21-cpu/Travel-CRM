import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/constants";
import { StageSelect } from "@/components/StageSelect";
import { Button } from "@/components/ui/Button";

const STAGE_DOT: Record<string, string> = {
  NEW: "bg-sky-500",
  QUALIFIED: "bg-violet-500",
  QUOTED: "bg-amber-500",
  NEGOTIATION: "bg-orange-500",
  WON: "bg-emerald-500",
  LOST: "bg-rose-400",
};

const STAGE_BORDER: Record<string, string> = {
  NEW: "border-l-sky-400",
  QUALIFIED: "border-l-violet-400",
  QUOTED: "border-l-amber-400",
  NEGOTIATION: "border-l-orange-400",
  WON: "border-l-emerald-400",
  LOST: "border-l-rose-300",
};

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
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3.5">
        <div>
          <h1 className="text-sm font-semibold text-stone-900">Pipeline</h1>
          <p className="text-xs text-stone-500">{leads.length} leads</p>
        </div>
        <Link href="/leads/new">
          <Button size="sm">
            <Plus size={14} />
            New lead
          </Button>
        </Link>
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {LEAD_STAGES.map((stage) => (
          <div key={stage} className="flex w-64 shrink-0 flex-col rounded-xl bg-stone-100/70">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage]}`} />
              <h2 className="text-xs font-semibold text-stone-700">{LEAD_STAGE_LABELS[stage]}</h2>
              <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                {byStage[stage].length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {byStage[stage].map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className={`block rounded-lg border border-l-4 border-stone-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md ${STAGE_BORDER[stage]}`}
                >
                  <p className="text-xs font-medium text-stone-900">{lead.customer.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-stone-500">
                    {lead.destination ?? lead.title}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400">
                    <span>{formatDistanceToNow(lead.updatedAt, { addSuffix: true })}</span>
                    {lead.budget ? (
                      <span className="font-medium text-stone-600">
                        ${lead.budget.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <StageSelect leadId={lead.id} stage={lead.stage} />
                </Link>
              ))}
              {byStage[stage].length === 0 && (
                <p className="px-1 py-2 text-center text-[11px] text-stone-400">No leads</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
