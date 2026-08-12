"use client";

import { useState } from "react";

export function NotesEditor({ leadId, initialNotes }: { leadId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);

  async function handleBlur() {
    if (saved) return;
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaved(true);
  }

  return (
    <textarea
      value={notes}
      onChange={(e) => {
        setNotes(e.target.value);
        setSaved(false);
      }}
      onBlur={handleBlur}
      rows={4}
      placeholder="Notes about this lead..."
      className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    />
  );
}
