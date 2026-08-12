"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUOTATION_ITEM_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

type Item = {
  description: string;
  category: (typeof QUOTATION_ITEM_CATEGORIES)[number];
  quantity: string;
  unitPrice: string;
};

const emptyItem = (): Item => ({ description: "", category: "OTHER", quantity: "1", unitPrice: "" });
const INPUT_CLASS =
  "rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export function QuoteForm({
  leadId,
  conversationId,
  customerName,
}: {
  leadId: string;
  conversationId: string | null;
  customerName: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState("0");
  const [agencyCost, setAgencyCost] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markSent, setMarkSent] = useState(true);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(Boolean(conversationId));

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const tax = subtotal * (Number(taxRate) || 0);
  const total = subtotal + tax;
  const margin = agencyCost ? total - Number(agencyCost) : null;

  function buildSummaryText(quotationTotal: number) {
    const lines = items
      .filter((i) => i.description)
      .map((i) => `• ${i.description} x${i.quantity} — ${currency} ${(Number(i.quantity) * Number(i.unitPrice)).toLocaleString()}`);
    return [
      `Hi ${customerName}, here's your quote:`,
      ...lines,
      `Total: ${currency} ${quotationTotal.toLocaleString()}`,
      validUntil ? `Valid until ${validUntil}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        currency,
        taxRate: Number(taxRate) || 0,
        agencyCost: agencyCost || undefined,
        validUntil: validUntil || undefined,
        markSent,
        items: items
          .filter((i) => i.description)
          .map((i) => ({
            description: i.description,
            category: i.category,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
      }),
    });

    if (!res.ok) {
      setSaving(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create quotation");
      return;
    }

    const { quotation } = await res.json();

    if (markSent && sendViaWhatsApp && conversationId) {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: buildSummaryText(quotation.total) }),
      });
    }

    setSaving(false);
    router.push(`/leads/${leadId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2">
            <input
              placeholder="Description (e.g. Round-trip flight)"
              value={item.description}
              onChange={(e) => updateItem(idx, { description: e.target.value })}
              className={`col-span-5 ${INPUT_CLASS}`}
            />
            <select
              value={item.category}
              onChange={(e) => updateItem(idx, { category: e.target.value as Item["category"] })}
              className={`col-span-3 ${INPUT_CLASS}`}
            >
              {QUOTATION_ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(idx, { quantity: e.target.value })}
              className={`col-span-1 ${INPUT_CLASS}`}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Unit price"
              value={item.unitPrice}
              onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
              className={`col-span-2 ${INPUT_CLASS}`}
            />
            <button
              type="button"
              onClick={() => setItems((cur) => cur.filter((_, i) => i !== idx))}
              className="col-span-1 text-xs text-stone-400 hover:text-rose-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((cur) => [...cur, emptyItem()])}
          className="text-xs font-medium text-stone-600 hover:underline"
        >
          + Add item
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Currency</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-full ${INPUT_CLASS}`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Tax rate (0-1)</label>
          <input
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Agency cost</label>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="optional"
            value={agencyCost}
            onChange={(e) => setAgencyCost(e.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Valid until</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={`w-full ${INPUT_CLASS}`}
          />
        </div>
      </div>

      <div className="rounded-lg bg-stone-50 p-3 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal</span>
          <span>
            {currency} {subtotal.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>Tax</span>
          <span>
            {currency} {tax.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-stone-200 pt-1 font-semibold text-stone-900">
          <span>Total</span>
          <span>
            {currency} {total.toLocaleString()}
          </span>
        </div>
        {margin !== null && (
          <div className="mt-1 flex justify-between text-xs text-emerald-600">
            <span>Margin</span>
            <span>
              {currency} {margin.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs text-stone-600">
          <input type="checkbox" checked={markSent} onChange={(e) => setMarkSent(e.target.checked)} />
          Mark as sent to customer — schedules a 3-touch follow-up (1, 3, 7 days)
        </label>
        {conversationId && markSent && (
          <label className="ml-5 flex items-center gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={sendViaWhatsApp}
              onChange={(e) => setSendViaWhatsApp(e.target.checked)}
            />
            Also deliver it on WhatsApp right now
          </label>
        )}
      </div>

      <Button type="submit" disabled={saving || items.every((i) => !i.description)} className="w-full">
        {saving ? "Saving..." : "Create quotation"}
      </Button>
    </form>
  );
}
