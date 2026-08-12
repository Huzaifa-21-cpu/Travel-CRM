"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
        <label className="mb-1 block text-xs font-medium text-stone-600">Follow up on</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          required
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-stone-600">Reminder note</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. check if they confirmed flights"
          className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving..." : "Schedule"}
      </Button>
    </form>
  );
}
