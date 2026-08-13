import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAiConfigured } from "@/lib/ai";
import { isStripeConfigured } from "@/lib/stripe";
import { KnowledgeBaseForm } from "@/components/KnowledgeBaseForm";
import { BillingSection } from "@/components/BillingSection";

export default async function SettingsPage() {
  const user = await requireUser();
  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="text-lg font-semibold text-stone-900">Settings</h1>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-stone-900">Billing &amp; plan</h2>
        {!isStripeConfigured() ? (
          <p className="text-xs text-stone-500">
            Billing isn&apos;t configured yet — add <span className="font-mono">STRIPE_SECRET_KEY</span> and the
            plan price IDs to enable upgrades.
          </p>
        ) : agency ? (
          <BillingSection
            currentPlan={agency.plan}
            subscriptionStatus={agency.subscriptionStatus}
            trialEndsAt={agency.trialEndsAt?.toISOString() ?? null}
            hasStripeCustomer={Boolean(agency.stripeCustomerId)}
            isOwner={user.role === "OWNER"}
          />
        ) : null}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-stone-900">AI reply assistant</h2>
        <p className="mb-3 text-xs text-stone-500">
          Describe your destinations, pricing approach, policies, office hours, and visa
          turnaround times here. The &ldquo;Suggest reply&rdquo; button in the inbox uses this to
          draft answers to common questions — agents always review before sending.
        </p>
        {!isAiConfigured() && (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ANTHROPIC_API_KEY isn&apos;t configured yet — the Suggest button won&apos;t appear
            until it&apos;s set.
          </p>
        )}
        <KnowledgeBaseForm initialValue={agency?.aiKnowledgeBase ?? ""} />
      </div>
    </div>
  );
}
