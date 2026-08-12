"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  KanbanSquare,
  Users,
  BellRing,
  LayoutDashboard,
  Settings,
  LogOut,
  Plane,
} from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/leads", label: "Pipeline", icon: KanbanSquare },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reminders", label: "Reminders", icon: BellRing },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ agentName, agencyName }: { agentName: string; agencyName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initial = agentName.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside className="flex h-full w-60 flex-col bg-stone-950">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 shadow-sm">
          <Plane size={16} className="-rotate-45 text-stone-950" strokeWidth={2.5} />
        </span>
        <p className="truncate text-sm font-semibold text-white">{agencyName}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-500/15 text-teal-300"
                  : "text-stone-400 hover:bg-stone-900 hover:text-stone-200",
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border border-stone-800 bg-stone-900/60 px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-semibold text-teal-300">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-stone-200">{agentName}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-200"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
