"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = { id: string; name: string; phone: string };

export default function NewLeadPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [pax, setPax] = useState("1");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || undefined,
        customerName: customerId ? undefined : customerName,
        customerPhone: customerId ? undefined : customerPhone,
        title,
        destination: destination || undefined,
        travelDate: travelDate || undefined,
        pax,
        budget: budget || undefined,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create lead");
      return;
    }
    const { lead } = await res.json();
    router.push(`/leads/${lead.id}`);
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-lg font-semibold text-slate-900">New lead</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— New customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {!customerId && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required={!customerId}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                WhatsApp phone
              </label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required={!customerId}
                placeholder="e.g. 14155551234"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Lead title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Family trip to Bali"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Travel date</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pax</label>
            <input
              type="number"
              min={1}
              value={pax}
              onChange={(e) => setPax(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Budget (USD)</label>
            <input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create lead"}
        </button>
      </form>
    </div>
  );
}
