export const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: 49,
    priceEnvVar: "STRIPE_PRICE_STARTER",
    description: "For a single agent getting off spreadsheets",
    features: ["1 agent seat", "WhatsApp inbox & pipeline", "Quotes & booking tracking", "Passport/visa reminders"],
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: 99,
    priceEnvVar: "STRIPE_PRICE_GROWTH",
    description: "For a small team with multiple agents",
    features: ["Up to 5 agent seats", "Everything in Starter", "AI reply drafting", "Agent performance dashboard"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 199,
    priceEnvVar: "STRIPE_PRICE_PRO",
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
