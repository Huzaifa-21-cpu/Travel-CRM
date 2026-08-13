"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PLANS, type PlanId } from "@/lib/plans";

type Props = {
  currentPlan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
  isOwner: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  canceled: "Cancelled",
  unpaid: "Unpaid",
};

const STATUS_TONES: Record<string, string> = {
  trialing: "bg-sky-50 text-sky-700",
  active: "bg-emerald-50 text-emerald-700",
  past_due: "bg-amber-50 text-amber-700",
  canceled: "bg-stone-100 text-stone-600",
  unpaid: "bg-rose-50 text-rose-700",
};

export function BillingSection({ currentPlan, subscriptionStatus, trialEndsAt, hasStripeCustomer, isOwner }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(planId: PlanId) {
    setError(null);
    setLoadingPlan(planId);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error ?? "Couldn't start checkout");
      setLoadingPlan(null);
      return;
    }
    window.location.href = data.url;
  }

  async function openPortal() {
    setError(null);
    setLoadingPlan("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error ?? "Couldn't open the billing portal");
      setLoadingPlan(null);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[subscriptionStatus] ?? "bg-stone-100 text-stone-600"}`}>
            {STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus}
          </span>
          {subscriptionStatus === "trialing" && trialEndsAt && (
            <span className="ml-2 text-xs text-stone-500">
              Trial ends {new Date(trialEndsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
        {hasStripeCustomer && isOwner && (
          <Button variant="secondary" size="sm" onClick={openPortal} disabled={loadingPlan !== null}>
            {loadingPlan === "portal" ? "Opening..." : "Manage subscription"}
          </Button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan && subscriptionStatus === "active";
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-lg border p-4 ${isCurrent ? "border-teal-500 ring-1 ring-teal-500/30" : "border-stone-200"}`}
            >
              <span className="text-sm font-semibold text-stone-900">{plan.name}</span>
              <span className="mt-1 text-xl font-semibold text-stone-900">
                ${plan.price}
                <span className="text-xs font-normal text-stone-400">/mo</span>
              </span>
              <p className="mt-1 text-xs text-stone-500">{plan.description}</p>
              <ul className="mt-3 flex-1 space-y-1 text-xs text-stone-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {isOwner ? (
                <Button
                  size="sm"
                  variant={isCurrent ? "secondary" : "primary"}
                  className="mt-4"
                  disabled={isCurrent || loadingPlan !== null}
                  onClick={() => startCheckout(plan.id)}
                >
                  {isCurrent ? "Current plan" : loadingPlan === plan.id ? "Redirecting..." : "Choose plan"}
                </Button>
              ) : (
                <p className="mt-4 text-xs text-stone-400">Ask your agency owner to change plans</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
