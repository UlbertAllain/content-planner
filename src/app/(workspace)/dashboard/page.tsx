import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listContents } from "@/features/contents/repository";
import { listIdeas } from "@/features/ideas/repository";
import { listCompanies } from "@/features/master-data/repository";
import { listUsers } from "@/features/users/repository";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatContentSchedule } from "@/lib/utils/date";

export default async function DashboardPage() {
  const user = await requireUser();
  const [contents, ideas, companies, users] = await Promise.all([listContents({ limit: 300 }), listIdeas(100), listCompanies(), listUsers()]);
  const companyMap = new Map(companies.map((item)=>[item.id,item]));
  const userMap = new Map(users.map((item)=>[item.id,item]));
  const mine = contents.filter((content)=>content.ownerId===user.id && !["PUBLISHED","CANCELLED"].includes(content.status));
  const stats = [
    ["Sedang saya kerjakan", mine.filter((x)=>x.status==="IN_PROGRESS").length],
    ["Siap tayang", mine.filter((x)=>x.status==="READY").length],
    ["Terjadwal", mine.filter((x)=>x.status==="SCHEDULED").length],
    ["Ide baru", ideas.filter((x)=>x.status==="NEW").length],
  ] as const;
  const upcoming = contents.filter((item)=>item.plannedPublishAt && !["PUBLISHED","CANCELLED"].includes(item.status)).sort((a,b)=>a.plannedPublishAt!.getTime()-b.plannedPublishAt!.getTime()).slice(0,8);
  const newestIdeas = ideas.filter((idea)=>idea.status==="NEW").slice(0,5);

  return <div className="page-wrap">
    <PageHeader eyebrow="Ringkasan hari ini" title={`Halo, ${user.name}`} description="Lihat jadwal bersama, pekerjaanmu, dan ide baru yang masuk ke tim Media." actions={<Link href="/contents/new" className="btn-primary">Buat konten</Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value])=><div key={label} className="card-pad"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p></div>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <section className="card-pad"><div className="flex items-center justify-between"><div><h2 className="section-title">Jadwal terdekat</h2><p className="muted mt-1">Konten lintas perusahaan yang akan tayang paling dekat.</p></div><Link href="/calendar" className="text-sm font-semibold text-blue-600">Buka kalender</Link></div><div className="mt-4 divide-y divide-slate-100">{upcoming.length?upcoming.map((content)=><Link key={content.id} href={`/contents/${content.id}`} prefetch={false} className="flex touch-manipulation items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">{companyMap.get(content.companyId||"")?.shortName||companyMap.get(content.companyId||"")?.name||"Tanpa perusahaan"}</p><p className="truncate text-sm font-semibold text-slate-800">{content.title||"Topik belum ditentukan"}</p><p className="mt-1 text-xs text-slate-400">{userMap.get(content.ownerId||"")?.name||"Belum ada pemilik"} · {formatContentSchedule(content.plannedPublishAt,content.scheduleHasTime)}</p></div><StatusBadge status={content.status}/></Link>):<p className="py-8 text-center text-sm text-slate-400">Belum ada jadwal tayang.</p>}</div></section>
      <section className="card-pad"><div className="flex items-center justify-between"><div><h2 className="section-title">Ide terbaru</h2><p className="muted mt-1">Kiriman publik dan catatan ide dari tim.</p></div><Link href="/ideas" className="text-sm font-semibold text-blue-600">Lihat semua</Link></div><div className="mt-4 space-y-2">{newestIdeas.map((idea)=><Link key={idea.id} href="/ideas" prefetch={false} className="block touch-manipulation rounded-xl border border-slate-100 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">{companyMap.get(idea.companyId)?.name||"Perusahaan"}</p><p className="mt-1 text-sm font-semibold text-slate-800">{idea.title}</p><p className="mt-1 text-xs text-slate-400">{idea.source==="PUBLIC" ? "Dari publik" : "Dari tim"}</p></Link>)}{!newestIdeas.length?<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada ide baru.</p>:null}</div></section>
    </div>
  </div>;
}
