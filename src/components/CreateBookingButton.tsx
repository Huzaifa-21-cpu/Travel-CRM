"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateBookingButton({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationId }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {saving ? "Booking..." : "Confirm booking"}
    </button>
  );
}
