import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAiConfigured } from "@/lib/ai";
import { KnowledgeBaseForm } from "@/components/KnowledgeBaseForm";

export default async function SettingsPage() {
  const user = await requireUser();
  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <h1 className="text-lg font-semibold text-slate-900">Settings</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">AI reply assistant</h2>
        <p className="mb-3 text-xs text-slate-500">
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
