"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReplyBox({
  conversationId,
  whatsappConfigured,
  aiConfigured,
}: {
  conversationId: string;
  whatsappConfigured: boolean;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setDrafting(true);
    setError(null);
    const res = await fetch(`/api/conversations/${conversationId}/suggest-reply`, {
      method: "POST",
    });
    setDrafting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to generate a draft");
      return;
    }
    const { draft } = await res.json();
    setBody(draft);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-3">
      {!whatsappConfigured && (
        <p className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          WhatsApp credentials aren&apos;t configured yet — replies will be saved but not
          delivered until you set WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID.
        </p>
      )}
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {aiConfigured && (
          <button
            type="button"
            onClick={handleSuggest}
            disabled={drafting}
            title="Draft a reply with AI — review before sending"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {drafting ? "Drafting..." : "✨ Suggest"}
          </button>
        )}
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
