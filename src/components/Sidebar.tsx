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
} from "lucide-react";

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

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-sm font-semibold text-slate-900">{agencyName}</p>
        <p className="text-xs text-slate-500">{agentName}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
