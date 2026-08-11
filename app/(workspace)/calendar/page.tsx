import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parse, startOfMonth, startOfWeek } from "date-fns";
import { id } from "date-fns/locale";
import { listContents } from "@/features/contents/repository";
import { listCompanies } from "@/features/master-data/repository";
import { listUsers } from "@/features/users/repository";
import { dateKey, endOfLocalDate, formatTime, parseDateInput } from "@/lib/utils/date";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; company?: string; owner?: string }> }) {
  const params = await searchParams;
  const currentMonth = dateKey(new Date()).slice(0, 7);
  const selectedMonth = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth;
  const selected = parse(selectedMonth, "yyyy-MM", new Date(2000, 0, 1));
  const monthStart = startOfMonth(selected);
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(endOfMonth(selected), { weekStartsOn: 1 });

  const [companies, users] = await Promise.all([listCompanies(), listUsers()]);
  const companyId = companies.some((item) => item.id === params.company) ? params.company : undefined;
  const ownerId = users.some((item) => item.id === params.owner) ? params.owner : undefined;
  const contents = await listContents({
    companyId,
    ownerId,
    from: parseDateInput(format(rangeStart, "yyyy-MM-dd")),
    to: endOfLocalDate(format(rangeEnd, "yyyy-MM-dd")),
    limit: 200,
  });

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const byDate = new Map<string, typeof contents>();

  for (const content of contents) {
    if (!content.plannedPublishAt || content.status === "CANCELLED") continue;
    const key = dateKey(content.plannedPublishAt);
    byDate.set(key, [...(byDate.get(key) ?? []), content]);
  }

  const companyMap = new Map(companies.map((item) => [item.id, item]));
  const userMap = new Map(users.map((item) => [item.id, item]));

  const query = (month: string) => {
    const p = new URLSearchParams({ month });
    if (companyId) p.set("company", companyId);
    if (ownerId) p.set("owner", ownerId);
    return `/calendar?${p}`;
  };

  const mobileDays = days.filter((day) => {
    if (!isSameMonth(day, selected)) return false;
    return (byDate.get(format(day, "yyyy-MM-dd"))?.length ?? 0) > 0;
  });

  const renderItem = (content: (typeof contents)[number], compact = false) => {
    const company = companyMap.get(content.companyId || "");
    const owner = userMap.get(content.ownerId || "");

    return (
      <Link
        key={content.id}
        href={`/contents/${content.id}`}
        prefetch={false}
        className={`render-lazy block touch-manipulation rounded-xl border border-slate-200 bg-white ${compact ? "p-2" : "p-3"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wide text-blue-600">
              {company?.shortName || company?.name || "Tanpa perusahaan"}
            </p>
            <p className={`${compact ? "mt-0.5 text-[11px] leading-4" : "mt-1 text-sm leading-5"} line-clamp-2 font-semibold text-slate-700`}>
              {content.title || "Topik belum ditentukan"}
            </p>
          </div>
          {!compact ? <StatusBadge status={content.status} /> : null}
        </div>
        <p className={`${compact ? "mt-1 text-[10px]" : "mt-2 text-xs"} text-slate-400`}>
          {owner?.name || "Belum ada pemilik"} · {content.scheduleHasTime ? formatTime(content.plannedPublishAt) : "Tanggal saja"}
        </p>
        {compact ? <div className="mt-1.5"><StatusBadge status={content.status} /></div> : null}
      </Link>
    );
  };

  return (
    <div className="page-wrap max-w-none">
      <PageHeader
        eyebrow="Jadwal bersama"
        title="Kalender Konten"
        description="Lihat kapan konten tayang, siapa yang membuat, tentang apa, dan untuk perusahaan mana."
        actions={(
          <div className="flex gap-2">
            <Link prefetch={false} href={query(format(addMonths(selected, -1), "yyyy-MM"))} className="btn-secondary">←</Link>
            <Link prefetch={false} href={query(format(addMonths(selected, 1), "yyyy-MM"))} className="btn-secondary">→</Link>
          </div>
        )}
      />

      <form className="card-pad mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" method="get">
        <input type="hidden" name="month" value={selectedMonth} />
        <div>
          <label className="label">Perusahaan</label>
          <select className="field" name="company" defaultValue={companyId || ""}>
            <option value="">Semua perusahaan</option>
            {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Pembuat</label>
          <select className="field" name="owner" defaultValue={ownerId || ""}>
            <option value="">Semua anggota</option>
            {users.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="flex items-end"><button className="btn-secondary w-full">Terapkan</button></div>
      </form>

      {/* Mobile uses an agenda instead of forcing a 980px desktop calendar into a
          small viewport. This cuts layout/paint work significantly on phones. */}
      <section className="card md:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <h2 className="text-lg font-semibold capitalize">{format(selected, "MMMM yyyy", { locale: id })}</h2>
          <Link href="/contents/new" className="text-sm font-semibold text-blue-600">+ Buat</Link>
        </div>

        {mobileDays.length ? (
          <div className="divide-y divide-slate-100">
            {mobileDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = byDate.get(key) ?? [];
              return (
                <div key={key} className="px-4 py-4">
                  <p className="mb-3 text-xs font-semibold capitalize text-slate-500">
                    {format(day, "EEEE, d MMMM", { locale: id })}
                  </p>
                  <div className="space-y-2">{items.map((content) => renderItem(content))}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">Belum ada jadwal bulan ini.</p>
            <p className="mt-1 text-xs text-slate-400">Konten yang sudah diberi tanggal akan muncul di sini.</p>
          </div>
        )}
      </section>

      {/* Desktop keeps the full month grid. */}
      <section className="card hidden overflow-hidden md:block">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold capitalize">{format(selected, "MMMM yyyy", { locale: id })}</h2>
          <Link href="/contents/new" className="text-sm font-semibold text-blue-600">+ Buat konten</Link>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                <div key={day} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const items = byDate.get(key) ?? [];
                return (
                  <div key={key} className={`min-h-40 border-b border-r border-slate-100 p-2 ${isSameMonth(day, selected) ? "bg-white" : "bg-slate-50/70"}`}>
                    <div className={`mb-2 text-xs font-semibold ${isSameMonth(day, selected) ? "text-slate-700" : "text-slate-300"}`}>{format(day, "d")}</div>
                    <div className="space-y-1.5">
                      {items.slice(0, 5).map((content) => renderItem(content, true))}
                      {items.length > 5 ? <p className="px-1 text-[10px] font-medium text-slate-400">+{items.length - 5} lainnya</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
