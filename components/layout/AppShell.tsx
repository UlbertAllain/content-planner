import Link from "next/link";
import { CalendarDays, Columns3, LayoutDashboard, Library, Lightbulb, Settings, UserRoundCheck, Users } from "lucide-react";
import type { AppUser } from "@/features/users/types";
import { userRoleLabel } from "@/features/users/labels";
import { LogoutButton } from "./LogoutButton";

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
  const navigation = user.role === "ADMIN" ? [...mainNavigation, ...adminNavigation] : mainNavigation;

  return (
    <div className="min-h-screen bg-[#f6f7f9] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen">
        <div className="flex h-full flex-col p-4">
          <div className="px-3 py-3"><p className="text-[11px] font-semibold tracking-[0.18em] text-blue-600">NEXTY CONTENT</p><p className="mt-1 text-xs text-slate-400">Ruang kerja divisi Media</p></div>
          <nav className="mt-5 space-y-1">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"><Icon size={17} strokeWidth={1.9} className="text-slate-400 group-hover:text-slate-700" />{label}</Link>)}</nav>
          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{user.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user.name}</p><p className="truncate text-xs text-slate-500">{user.position || userRoleLabel(user.role)}</p></div></div><div className="mt-3"><LogoutButton /></div></div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><div className="lg:hidden"><p className="text-xs font-semibold tracking-[0.14em] text-blue-600">NEXTY CONTENT</p></div><nav className="hidden gap-1 overflow-x-auto md:flex lg:hidden">{navigation.map(({href,label})=><Link key={href} href={href} className="whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">{label}</Link>)}</nav><div className="ml-auto flex items-center gap-2"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{user.name}</p><p className="text-[11px] text-slate-400">{userRoleLabel(user.role)}</p></div><div className="lg:hidden"><LogoutButton compact /></div></div></div>
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 md:hidden">{navigation.map(({href,label})=><Link key={href} href={href} className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">{label}</Link>)}</div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
