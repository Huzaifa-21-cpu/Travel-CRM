"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plane, MessageCircle, KanbanSquare, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TRIAL_DAYS } from "@/lib/plans";

const FEATURES = [
  { icon: MessageCircle, text: "Every WhatsApp inquiry lands in one shared inbox" },
  { icon: KanbanSquare, text: "Track leads from first message to booked trip" },
  { icon: BellRing, text: "Never miss a passport or visa renewal again" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  agencyName?: string;
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!agencyName.trim()) errors.agencyName = "Agency name is required";
    if (!name.trim()) errors.name = "Your name is required";
    const trimmedEmail = email.trim();
    if (!trimmedEmail) errors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(trimmedEmail)) errors.email = "Enter a valid email address";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Use at least 8 characters";
    if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match";
    return errors;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyName: agencyName.trim(), name: name.trim(), email: email.trim(), password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't create your account");
      return;
    }
    router.push("/inbox");
    router.refresh();
  }

  const inputClass = (hasError: boolean) =>
    `mb-1 w-full rounded-lg border px-3 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 ${
      hasError
        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
        : "border-stone-300 focus:border-teal-500 focus:ring-teal-500/20"
    }`;

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
            Start your {TRIAL_DAYS}-day free trial.
          </h1>
          <p className="mt-3 text-sm text-teal-50/90">
            Set up your agency workspace in under a minute — no card required to start.
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

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-10 lg:w-1/2">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <Plane size={18} className="-rotate-45 text-white" strokeWidth={2.5} />
            </span>
          </div>
          <h2 className="text-xl font-semibold text-stone-900">Create your workspace</h2>
          <p className="mb-6 text-sm text-stone-500">{TRIAL_DAYS} days free, no credit card needed</p>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}

          <label className="mb-1 block text-sm font-medium text-stone-700">Agency name</label>
          <input
            type="text"
            value={agencyName}
            onChange={(e) => {
              setAgencyName(e.target.value);
              clearFieldError("agencyName");
            }}
            placeholder="Wanderlust Travels"
            aria-invalid={Boolean(fieldErrors.agencyName)}
            className={inputClass(Boolean(fieldErrors.agencyName))}
          />
          <p className="mb-3 min-h-[1rem] text-xs text-rose-600">{fieldErrors.agencyName}</p>

          <label className="mb-1 block text-sm font-medium text-stone-700">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            placeholder="Amina Yusuf"
            aria-invalid={Boolean(fieldErrors.name)}
            className={inputClass(Boolean(fieldErrors.name))}
          />
          <p className="mb-3 min-h-[1rem] text-xs text-rose-600">{fieldErrors.name}</p>

          <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            className={inputClass(Boolean(fieldErrors.email))}
          />
          <p className="mb-3 min-h-[1rem] text-xs text-rose-600">{fieldErrors.email}</p>

          <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            className={inputClass(Boolean(fieldErrors.password))}
          />
          <p className="mb-3 min-h-[1rem] text-xs text-rose-600">{fieldErrors.password}</p>

          <label className="mb-1 block text-sm font-medium text-stone-700">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearFieldError("confirmPassword");
            }}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className={inputClass(Boolean(fieldErrors.confirmPassword))}
          />
          <p className="mb-5 min-h-[1rem] text-xs text-rose-600">{fieldErrors.confirmPassword}</p>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating workspace..." : "Start free trial"}
          </Button>

          <p className="mt-4 text-center text-xs text-stone-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-teal-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
