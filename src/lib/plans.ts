export const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: 49,
    description: "For a single agent getting off spreadsheets",
    features: ["1 agent seat", "WhatsApp inbox & pipeline", "Quotes & booking tracking", "Passport/visa reminders"],
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: 99,
    description: "For a small team with multiple agents",
    features: ["Up to 5 agent seats", "Everything in Starter", "AI reply drafting", "Agent performance dashboard"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 199,
    description: "For agencies running high WhatsApp volume",
    features: ["Unlimited agent seats", "Everything in Growth", "Priority support"],
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export function getPlan(id: string) {
  return PLANS.find((p) => p.id === id);
}

export const TRIAL_DAYS = 14;

/** Statuses that should be treated as "has access" — everything else is blocked/warned. */
export const ACTIVE_STATUSES = new Set(["trialing", "active"]);

/** How long a paid plan stays active after a successful charge, since Tap has no auto-renewing subscription. */
export const BILLING_PERIOD_DAYS = 30;
