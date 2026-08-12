import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // The signed cookie can outlive the rows it points to (DB reset/migration,
  // user removed) — the JWT signature alone can't catch that, so re-check both.
  // Cookies can't be mutated during a render, so we just redirect — the next
  // successful login overwrites this stale cookie anyway.
  const [agency, user] = await Promise.all([
    prisma.agency.findUnique({ where: { id: session.agencyId } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);
  if (!agency || !user) redirect("/login");

  return (
    <div className="flex h-screen w-full">
      <Sidebar agentName={session.name} agencyName={agency?.name ?? "Agency"} />
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
