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
  const contents = await listContents({ companyId, ownerId, from: parseDateInput(format(rangeStart, "yyyy-MM-dd")), to: endOfLocalDate(format(rangeEnd, "yyyy-MM-dd")), limit: 300 });
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

  return <div className="page-wrap max-w-none">
    <PageHeader eyebrow="Jadwal bersama" title="Kalender Konten" description="Lihat kapan konten tayang, siapa yang membuat, tentang apa, dan untuk perusahaan mana." actions={<div className="flex gap-2"><Link href={query(format(addMonths(selected,-1),"yyyy-MM"))} className="btn-secondary">←</Link><Link href={query(format(addMonths(selected,1),"yyyy-MM"))} className="btn-secondary">→</Link></div>} />
    <form className="card-pad mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" method="get">
      <input type="hidden" name="month" value={selectedMonth} />
      <div><label className="label">Perusahaan</label><select className="field" name="company" defaultValue={companyId || ""}><option value="">Semua perusahaan</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div><label className="label">Pembuat</label><select className="field" name="owner" defaultValue={ownerId || ""}><option value="">Semua anggota</option>{users.filter((item)=>item.status==="ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="flex items-end"><button className="btn-secondary w-full">Terapkan</button></div>
    </form>
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><h2 className="text-lg font-semibold capitalize">{format(selected,"MMMM yyyy",{locale:id})}</h2><Link href="/contents/new" className="text-sm font-semibold text-blue-600">+ Buat konten</Link></div>
      <div className="overflow-x-auto"><div className="min-w-[980px]">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map((day)=><div key={day} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{day}</div>)}</div>
        <div className="grid grid-cols-7">{days.map((day)=>{const key=format(day,"yyyy-MM-dd"); const items=byDate.get(key)??[]; return <div key={key} className={`min-h-40 border-b border-r border-slate-100 p-2 ${isSameMonth(day,selected)?"bg-white":"bg-slate-50/70"}`}><div className={`mb-2 text-xs font-semibold ${isSameMonth(day,selected)?"text-slate-700":"text-slate-300"}`}>{format(day,"d")}</div><div className="space-y-1.5">{items.slice(0,5).map((content)=>{const company=companyMap.get(content.companyId||""); const owner=userMap.get(content.ownerId||""); return <Link key={content.id} href={`/contents/${content.id}`} className="block rounded-lg border border-slate-200 bg-white p-2 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-wide text-blue-600">{company?.shortName||company?.name||"Tanpa perusahaan"}</p><p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-700">{content.title||"Topik belum ditentukan"}</p><p className="mt-1 text-[10px] text-slate-400">{owner?.name||"Belum ada pemilik"} · {content.scheduleHasTime?formatTime(content.plannedPublishAt):"Tanggal saja"}</p><div className="mt-1.5"><StatusBadge status={content.status}/></div></Link>})}{items.length>5?<p className="px-1 text-[10px] font-medium text-slate-400">+{items.length-5} lainnya</p>:null}</div></div>})}</div>
      </div></div>
    </section>
  </div>;
}
