"use client";

import { useState } from "react";

export function KnowledgeBaseForm({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/agency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiKnowledgeBase: value }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder={
          "e.g. We specialize in Southeast Asia and the Maldives. Standard visa processing takes 5-7 business days. Office hours are 9am-6pm GST, Sunday-Thursday. Deposits are 25% to confirm a booking..."
        }
        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {savedAt && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}
