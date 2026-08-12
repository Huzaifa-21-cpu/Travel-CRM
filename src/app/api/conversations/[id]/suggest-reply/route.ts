import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { draftReply, isAiConfigured } from "@/lib/ai";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/conversations/[id]/suggest-reply">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 400 });
  }

  const { id } = await ctx.params;

  const [conversation, agency] = await Promise.all([
    prisma.conversation.findFirst({
      where: { id, agencyId: user.agencyId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    }),
    prisma.agency.findUnique({ where: { id: user.agencyId } }),
  ]);
  if (!conversation || !agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const draft = await draftReply({
      agencyName: agency.name,
      knowledgeBase: agency.aiKnowledgeBase,
      customerName: conversation.customer.name,
      history: conversation.messages,
    });
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("AI draft failed:", err);
    return NextResponse.json({ error: "Failed to generate a draft" }, { status: 502 });
  }
}
