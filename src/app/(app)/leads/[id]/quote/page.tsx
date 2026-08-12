import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteForm } from "@/components/QuoteForm";

export default async function NewQuotePage(props: PageProps<"/leads/[id]/quote">) {
  const { id } = await props.params;
  const user = await requireUser();

  const lead = await prisma.lead.findFirst({
    where: { id, agencyId: user.agencyId },
    include: { customer: true },
  });
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <p className="mb-1 text-xs text-stone-500">
        <Link href={`/leads/${lead.id}`} className="hover:underline">
          {lead.title}
        </Link>
      </p>
      <h1 className="mb-4 text-lg font-semibold text-stone-900">
        New quotation for {lead.customer.name}
      </h1>
      <QuoteForm
        leadId={lead.id}
        conversationId={lead.conversationId}
        customerName={lead.customer.name}
      />
    </div>
  );
}
