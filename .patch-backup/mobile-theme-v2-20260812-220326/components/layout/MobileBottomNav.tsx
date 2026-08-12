"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Columns3,
  LayoutDashboard,
  Library,
  Lightbulb,
  MoreHorizontal,
  Settings,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const primaryNavigation = [
  { href: "/dashboard", label: "Ringkasan", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/my-work", label: "Pekerjaan Saya", shortLabel: "Kerja", icon: UserRoundCheck },
  { href: "/calendar", label: "Kalender Konten", shortLabel: "Kalender", icon: CalendarDays },
  { href: "/board", label: "Alur Konten", shortLabel: "Alur", icon: Columns3 },
];

const secondaryNavigation = [
  { href: "/ideas", label: "Ide Konten", icon: Lightbulb },
  { href: "/contents", label: "Semua Konten", icon: Library },
];

const adminNavigation = [
  { href: "/team", label: "Tim", icon: Users },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreNavigation = isAdmin
    ? [...secondaryNavigation, ...adminNavigation]
    : secondaryNavigation;

  const moreActive = moreNavigation.some(({ href }) => isRouteActive(pathname, href));

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu lainnya"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMoreOpen(false)}
          />

          <div className="absolute bottom-[calc(5.4rem+env(safe-area-inset-bottom))] left-3 right-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  Menu lainnya
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Akses fitur tambahan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-1">
              {moreNavigation.map(({ href, label, icon: Icon }) => {
                const active = isRouteActive(pathname, href);

                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={() => setMoreOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-10 w-10 place-items-center rounded-xl",
                        active
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                      ].join(" ")}
                    >
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {primaryNavigation.map(({ href, shortLabel, icon: Icon }) => {
            const active = isRouteActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={[
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                ].join(" ")}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.9} />
                <span className="w-full truncate text-center">{shortLabel}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            className={[
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors",
              moreOpen || moreActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
            ].join(" ")}
          >
            <MoreHorizontal size={19} strokeWidth={moreOpen || moreActive ? 2.2 : 1.9} />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
}