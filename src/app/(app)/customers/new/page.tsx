"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email: email || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create customer");
      return;
    }
    const { customer } = await res.json();
    router.push(`/customers/${customer.id}`);
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold text-stone-900">New customer</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">WhatsApp phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="e.g. 14155551234"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create customer"}
        </button>
      </form>
    </div>
  );
}
