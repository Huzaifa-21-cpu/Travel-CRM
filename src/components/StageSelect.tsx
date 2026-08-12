"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/constants";

export function StageSelect({ leadId, stage }: { leadId: string; stage: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUpdating(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: e.target.value }),
    });
    setUpdating(false);
    router.refresh();
  }

  return (
    <div className="mt-2" onClick={(e) => e.preventDefault()}>
      <select
        value={stage}
        disabled={updating}
        onClick={(e) => e.stopPropagation()}
        onChange={handleChange}
        className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-600 disabled:opacity-50"
      >
        {LEAD_STAGES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STAGE_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
