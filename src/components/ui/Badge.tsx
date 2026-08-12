import { clsx } from "clsx";

const TONE_CLASSES = {
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  stone: "bg-stone-100 text-stone-600 ring-stone-500/20",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
} as const;

export type BadgeTone = keyof typeof TONE_CLASSES;

export function Badge({ tone = "stone", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}

export const STAGE_TONES: Record<string, BadgeTone> = {
  NEW: "sky",
  QUALIFIED: "violet",
  QUOTED: "amber",
  NEGOTIATION: "orange",
  WON: "emerald",
  LOST: "rose",
};

export const URGENCY_TONES: Record<string, BadgeTone> = {
  EXPIRED: "rose",
  URGENT: "rose",
  SOON: "orange",
  UPCOMING: "amber",
  PLAN_AHEAD: "sky",
  OK: "stone",
};

export const URGENCY_DOTS: Record<string, string> = {
  EXPIRED: "🔴",
  URGENT: "🔴",
  SOON: "🟠",
  UPCOMING: "🟡",
  PLAN_AHEAD: "🟢",
  OK: "",
};
