"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUOTATION_ITEM_CATEGORIES } from "@/lib/constants";

type Item = {
  description: string;
  category: (typeof QUOTATION_ITEM_CATEGORIES)[number];
  quantity: string;
  unitPrice: string;
};

const emptyItem = (): Item => ({ description: "", category: "OTHER", quantity: "1", unitPrice: "" });

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
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendAfterCreate, setSendAfterCreate] = useState(Boolean(conversationId));

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const tax = subtotal * (Number(taxRate) || 0);
  const total = subtotal + tax;

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
        validUntil: validUntil || undefined,
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

    if (sendAfterCreate && conversationId) {
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
              className="col-span-5 rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <select
              value={item.category}
              onChange={(e) => updateItem(idx, { category: e.target.value as Item["category"] })}
              className="col-span-3 rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
              className="col-span-1 rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Unit price"
              value={item.unitPrice}
              onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
              className="col-span-2 rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
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
            className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Valid until</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <div className="rounded-md bg-stone-50 p-3 text-sm">
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
      </div>

      {conversationId && (
        <label className="flex items-center gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={sendAfterCreate}
            onChange={(e) => setSendAfterCreate(e.target.checked)}
          />
          Send this quote to the customer on WhatsApp after saving
        </label>
      )}

      <button
        type="submit"
        disabled={saving || items.every((i) => !i.description)}
        className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Create quotation"}
      </button>
    </form>
  );
}
