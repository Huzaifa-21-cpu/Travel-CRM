"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { FAMILY_RELATIONSHIPS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

type Member = {
  id: string;
  name: string;
  relationship: string | null;
  passportNumber: string | null;
  passportExpiry: string | Date | null;
};

export function FamilyMembersSection({ customerId, members }: { customerId: string; members: Member[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<string>(FAMILY_RELATIONSHIPS[0]);
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/customers/${customerId}/family`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        relationship,
        passportNumber: passportNumber || undefined,
        passportExpiry: passportExpiry || undefined,
      }),
    });
    setSaving(false);
    setName("");
    setPassportNumber("");
    setPassportExpiry("");
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(memberId: string) {
    await fetch(`/api/customers/${customerId}/family/${memberId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
          <Users size={15} className="text-teal-600" />
          Family members
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
        >
          <Plus size={12} className="mr-1 inline" />
          Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-3">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="col-span-2 rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {FAMILY_RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            placeholder="Passport number"
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <input
            type="date"
            value={passportExpiry}
            onChange={(e) => setPassportExpiry(e.target.value)}
            className="col-span-2 rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <Button type="submit" size="sm" disabled={saving} className="col-span-2">
            {saving ? "Adding..." : "Add family member"}
          </Button>
        </form>
      )}

      <ul className="space-y-1.5">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-stone-900">
                {m.name} <span className="text-xs font-normal text-stone-400">{m.relationship}</span>
              </p>
              {m.passportNumber && (
                <p className="text-xs text-stone-400">
                  {m.passportNumber}
                  {m.passportExpiry ? ` · expires ${format(new Date(m.passportExpiry), "MMM d, yyyy")}` : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(m.id)}
              className="rounded-md p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {members.length === 0 && <li className="text-xs text-stone-400">No family members added.</li>}
      </ul>
    </div>
  );
}
