import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { id: session.agencyId } });

  return (
    <div className="flex h-screen w-full">
      <Sidebar agentName={session.name} agencyName={agency?.name ?? "Agency"} />
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
