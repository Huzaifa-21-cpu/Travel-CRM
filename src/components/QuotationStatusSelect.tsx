"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUOTATION_STATUSES } from "@/lib/constants";

export function QuotationStatusSelect({ quotationId, status }: { quotationId: string; status: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUpdating(true);
    await fetch(`/api/quotations/${quotationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.target.value }),
    });
    setUpdating(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={updating}
      onChange={handleChange}
      className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-1 text-[11px] font-medium text-stone-600 transition-colors hover:bg-white disabled:opacity-50"
    >
      {QUOTATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}
