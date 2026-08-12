import Link from "next/link";

import {
  CalendarDays,
  Columns3,
  LayoutDashboard,
  Library,
  Lightbulb,
  Settings,
  UserRoundCheck,
  Users,
} from "lucide-react";

import type { AppUser } from "@/features/users/types";
import { userRoleLabel } from "@/features/users/labels";

import { LogoutButton } from "./LogoutButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { ThemeToggle } from "./ThemeToggle";

const mainNavigation = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/my-work", label: "Pekerjaan Saya", icon: UserRoundCheck },
  { href: "/calendar", label: "Kalender Konten", icon: CalendarDays },
  { href: "/board", label: "Alur Konten", icon: Columns3 },
  { href: "/ideas", label: "Ide Konten", icon: Lightbulb },
  { href: "/contents", label: "Semua Konten", icon: Library },
];

const adminNavigation = [
  { href: "/team", label: "Tim", icon: Users },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const navigation =
    user.role === "ADMIN" ? [...mainNavigation, ...adminNavigation] : mainNavigation;

  return (
    <div className="min-h-screen bg-[#f6f7f9] transition-colors dark:bg-slate-950 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:block lg:h-screen">
        <div className="flex h-full flex-col p-4">
          <div className="px-3 py-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-600 dark:text-blue-400">
              NEXTY CONTENT
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Ruang kerja divisi Media
            </p>
          </div>

          <nav className="mt-5 space-y-1">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className="group flex touch-manipulation items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              >
                <Icon
                  size={17}
                  strokeWidth={1.9}
                  className="text-slate-400 transition-colors group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                {user.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.position || userRoleLabel(user.role)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-[11px] font-semibold tracking-[0.14em] text-blue-600 dark:text-blue-400 sm:text-xs">
                NEXTY CONTENT
              </p>
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <div className="flex min-w-0 items-center gap-2 rounded-xl sm:pr-1">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 lg:hidden">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 text-right">
                  <p className="max-w-[82px] truncate text-xs font-semibold text-slate-800 dark:text-slate-100 sm:max-w-[180px] sm:text-sm">
                    {user.name}
                  </p>
                  <p className="hidden text-[11px] text-slate-400 dark:text-slate-500 sm:block">
                    {userRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              <ThemeToggle userId={user.id} />

              <div className="lg:hidden">
                <LogoutButton compact />
              </div>
            </div>
          </div>
        </header>

        <main className="pb-24 lg:pb-0">{children}</main>

        <MobileBottomNav isAdmin={user.role === "ADMIN"} />
      </div>
    </div>
  );
}