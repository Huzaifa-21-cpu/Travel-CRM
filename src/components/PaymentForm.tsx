"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHODS } from "@/lib/constants";

export function PaymentForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("BANK_TRANSFER");
  const [status, setStatus] = useState<"PENDING" | "PAID">("PAID");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    await fetch(`/api/bookings/${bookingId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method, status }),
    });
    setSaving(false);
    setAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        >
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Add payment"}
      </button>
    </form>
  );
}
