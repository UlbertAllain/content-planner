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
  {
    href: "/dashboard",
    label: "Ringkasan",
    shortLabel: "Home",
    icon: LayoutDashboard,
  },
  {
    href: "/contents",
    label: "Semua Konten",
    shortLabel: "Konten",
    icon: Library,
  },
  {
    href: "/my-work",
    label: "Pekerjaan Saya",
    shortLabel: "Kerja",
    icon: UserRoundCheck,
  },
  {
    href: "/calendar",
    label: "Kalender Konten",
    shortLabel: "Kalender",
    icon: CalendarDays,
  },
];

const secondaryNavigation = [
  { href: "/board", label: "Alur Konten", icon: Columns3 },
  { href: "/ideas", label: "Ide Konten", icon: Lightbulb },
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

  const moreActive = moreNavigation.some(({ href }) =>
    isRouteActive(pathname, href),
  );

  function closeMoreMenu() {
    setMoreOpen(false);
  }

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu lainnya"
            className="absolute inset-0 bg-slate-950/35 dark:bg-black/35"
            onClick={closeMoreMenu}
          />

          <div className="absolute bottom-[calc(5.4rem+env(safe-area-inset-bottom))] left-3 right-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-2xl dark:border-[#343940] dark:bg-[#202328]">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-[#eceef2]">
                  Menu lainnya
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9299a3]">
                  Fitur tambahan
                </p>
              </div>

              <button
                type="button"
                onClick={closeMoreMenu}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-[#9299a3] dark:hover:bg-[#2a2e34]"
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
                    onClick={closeMoreMenu}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-[#283345] dark:text-[#a9bee0]"
                        : "text-slate-700 hover:bg-slate-100 dark:text-[#c7ccd3] dark:hover:bg-[#292d32]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-10 w-10 place-items-center rounded-xl",
                        active
                          ? "bg-blue-100 text-blue-700 dark:bg-[#303d52] dark:text-[#a9bee0]"
                          : "bg-slate-100 text-slate-500 dark:bg-[#292d32] dark:text-[#9299a3]",
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-[#30343a] dark:bg-[#1b1e22]/95 dark:shadow-[0_-8px_28px_rgba(0,0,0,0.18)] lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {primaryNavigation.map(({ href, shortLabel, icon: Icon }) => {
            const active = isRouteActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={closeMoreMenu}
                className={[
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-[#283345] dark:text-[#a9bee0]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#858d98] dark:hover:bg-[#272b30] dark:hover:text-[#dfe2e6]",
                ].join(" ")}
              >
                <Icon size={19} strokeWidth={active ? 2.15 : 1.85} />
                <span className="w-full truncate text-center">
                  {shortLabel}
                </span>
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
                ? "bg-blue-50 text-blue-700 dark:bg-[#283345] dark:text-[#a9bee0]"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#858d98] dark:hover:bg-[#272b30] dark:hover:text-[#dfe2e6]",
            ].join(" ")}
          >
            <MoreHorizontal
              size={19}
              strokeWidth={moreOpen || moreActive ? 2.15 : 1.85}
            />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
}