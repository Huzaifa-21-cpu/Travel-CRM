import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isBlobConfigured } from "@/lib/blob";
import { DOCUMENT_TYPES } from "@/lib/constants";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest, ctx: RouteContext<"/api/customers/[id]/documents">) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "Document storage isn't configured yet (BLOB_READ_WRITE_TOKEN)" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const customer = await prisma.customer.findFirst({ where: { id, agencyId: user.agencyId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const type = formData?.get("type");

  if (!(file instanceof File) || typeof type !== "string" || !DOCUMENT_TYPES.includes(type as (typeof DOCUMENT_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const blob = await put(`customers/${customer.id}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const document = await prisma.document.create({
    data: {
      customerId: customer.id,
      type,
      fileName: file.name,
      fileUrl: blob.url,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
