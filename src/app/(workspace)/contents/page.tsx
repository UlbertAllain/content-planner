import Link from "next/link";
import { listContents } from "@/features/contents/repository";
import { listCompanies } from "@/features/master-data/repository";
import { listUsers } from "@/features/users/repository";
import type { ContentStatus } from "@/features/contents/types";
import { contentStatusLabels } from "@/features/contents/labels";
import { ContentCard } from "@/features/contents/ContentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

const statuses: ContentStatus[] = ["DRAFT","IN_PROGRESS","READY","SCHEDULED","PUBLISHED","CANCELLED"];

export default async function ContentsPage({ searchParams }: { searchParams: Promise<{ archived?: string; q?: string; status?: string; company?: string; owner?: string }> }) {
  const { archived, q="", status="", company="", owner="" } = await searchParams;
  const archiveMode = archived === "1";
  const selectedStatus = statuses.includes(status as ContentStatus) ? status as ContentStatus : undefined;
  const [all, companies, users] = await Promise.all([listContents({ limit: 500, includeArchived: true }), listCompanies(), listUsers()]);
  const keyword = q.trim().toLocaleLowerCase("id-ID");
  const contents = all.filter((item)=>{
    if (archiveMode !== Boolean(item.archivedAt)) return false;
    if (selectedStatus && item.status !== selectedStatus) return false;
    if (company && item.companyId !== company) return false;
    if (owner && item.ownerId !== owner) return false;
    if (!keyword) return true;
    return [item.title||"", item.copy.brief||"", item.copy.script||"", item.copy.caption||""].join(" ").toLocaleLowerCase("id-ID").includes(keyword);
  });
  const companyMap = new Map(companies.map((item)=>[item.id,item.name]));
  const userMap = new Map(users.map((item)=>[item.id,item.name]));
  const hasFilter = Boolean(q||selectedStatus||company||owner);
  return <div className="page-wrap">
    <PageHeader eyebrow={archiveMode?"Riwayat konten":"Pusat konten"} title={archiveMode?"Arsip Konten":"Semua Konten"} description={archiveMode?"Konten yang sudah dipindahkan ke arsip.":"Semua draft dan konten tim dapat dilihat bersama. Pengeditan tetap mengikuti kepemilikan konten."} actions={<div className="flex gap-2"><Link href={archiveMode?"/contents":"/contents?archived=1"} className="btn-secondary">{archiveMode?"Konten aktif":"Buka arsip"}</Link>{!archiveMode?<Link href="/contents/new" className="btn-primary">Buat konten</Link>:null}</div>} />
    <form className="card-pad mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px_200px_auto]" method="get">{archiveMode?<input type="hidden" name="archived" value="1"/>:null}<div><label className="label">Cari</label><input className="field" name="q" defaultValue={q} placeholder="Topik, script, caption..."/></div><div><label className="label">Tahap</label><select className="field" name="status" defaultValue={selectedStatus||""}><option value="">Semua tahap</option>{statuses.map((x)=><option key={x} value={x}>{contentStatusLabels[x]}</option>)}</select></div><div><label className="label">Perusahaan</label><select className="field" name="company" defaultValue={company}><option value="">Semua perusahaan</option>{companies.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div><label className="label">Pembuat</label><select className="field" name="owner" defaultValue={owner}><option value="">Semua anggota</option>{users.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="flex items-end gap-2"><button className="btn-primary">Terapkan</button>{hasFilter?<Link className="btn-secondary" href={archiveMode?"/contents?archived=1":"/contents"}>Reset</Link>:null}</div></form>
    {contents.length?<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{contents.map((item)=><ContentCard key={item.id} content={item} companyName={companyMap.get(item.companyId||"")} ownerName={userMap.get(item.ownerId||"")}/>)}</div>:<EmptyState title={hasFilter?"Konten tidak ditemukan":archiveMode?"Arsip masih kosong":"Belum ada konten"} description={hasFilter?"Coba ubah filter yang dipilih.":"Mulai dengan mencatat ide atau membuat rencana konten."} href={!hasFilter&&!archiveMode?"/contents/new":undefined} action={!hasFilter&&!archiveMode?"Buat konten":undefined}/>} 
  </div>;
}
