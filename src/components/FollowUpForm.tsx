"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FollowUpForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [dueAt, setDueAt] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dueAt) return;
    setSaving(true);
    await fetch(`/api/leads/${leadId}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueAt, message: message || undefined }),
    });
    setSaving(false);
    setDueAt("");
    setMessage("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Follow up on</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Reminder note</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. check if they confirmed flights"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Schedule"}
      </button>
    </form>
  );
}
