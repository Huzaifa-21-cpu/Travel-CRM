"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  customerId: string;
  initial: {
    name: string;
    email: string;
    passportNumber: string;
    passportExpiry: string;
    visaCountry: string;
    visaExpiry: string;
    notes: string;
  };
};

export function CustomerDetailsForm({ customerId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Passport number</label>
          <input
            value={form.passportNumber}
            onChange={(e) => set("passportNumber", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Passport expiry</label>
          <input
            type="date"
            value={form.passportExpiry}
            onChange={(e) => set("passportExpiry", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Visa country</label>
          <input
            value={form.visaCountry}
            onChange={(e) => set("visaCountry", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Visa expiry</label>
          <input
            type="date"
            value={form.visaExpiry}
            onChange={(e) => set("visaExpiry", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {savedAt && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}
