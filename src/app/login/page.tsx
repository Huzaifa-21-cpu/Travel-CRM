"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, MessageCircle, KanbanSquare, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  { icon: MessageCircle, text: "Every WhatsApp inquiry lands in one shared inbox" },
  { icon: KanbanSquare, text: "Track leads from first message to booked trip" },
  { icon: BellRing, text: "Never miss a passport or visa renewal again" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@demoagency.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/inbox");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Plane size={18} className="-rotate-45" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold tracking-wide">Travel CRM</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Stop losing WhatsApp travel leads.
          </h1>
          <p className="mt-3 text-sm text-teal-50/90">
            Every inquiry, quote, and booking in one place — built for the way travel agencies
            actually work on WhatsApp.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-teal-50/90">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-teal-100/60">
          &ldquo;We stopped losing leads in group chats.&rdquo;
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <Plane size={18} className="-rotate-45 text-white" strokeWidth={2.5} />
            </span>
          </div>
          <h2 className="text-xl font-semibold text-stone-900">Welcome back</h2>
          <p className="mb-6 text-sm text-stone-500">Sign in to your agency workspace</p>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            required
          />

          <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            required
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <p className="mt-4 text-center text-xs text-stone-400">
            Demo seed login: owner@demoagency.com / password123
          </p>
        </form>
      </div>
    </div>
  );
}
