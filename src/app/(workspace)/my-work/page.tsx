import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listContents } from "@/features/contents/repository";
import { listCompanies } from "@/features/master-data/repository";
import { ContentCard } from "@/features/contents/ContentCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function MyWorkPage() {
  const user = await requireUser();
  const [contents, companies] = await Promise.all([listContents({ ownerId: user.id, limit: 300 }), listCompanies()]);
  const companyMap = new Map(companies.map((item) => [item.id, item.name]));
  const active = contents.filter((item) => !["PUBLISHED", "CANCELLED"].includes(item.status));
  const groups = [
    ["Sedang saya kerjakan", active.filter((x) => x.status === "IN_PROGRESS")],
    ["Siap tayang", active.filter((x) => x.status === "READY")],
    ["Terjadwal", active.filter((x) => x.status === "SCHEDULED")],
    ["Draft", active.filter((x) => x.status === "DRAFT")],
  ] as const;

  return <div className="page-wrap">
    <PageHeader eyebrow="Konten milik saya" title="Pekerjaan Saya" description="Konten yang kamu buat otomatis menjadi tanggung jawabmu dari planning sampai tayang." actions={<Link href="/contents/new" className="btn-primary">Buat konten</Link>} />
    {active.length ? <div className="space-y-6">{groups.map(([label, items]) => items.length ? <section key={label}><div className="mb-3 flex items-center gap-2"><h2 className="section-title">{label}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{items.length}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ContentCard key={item.id} content={item} companyName={companyMap.get(item.companyId || "")} ownerName={user.name} />)}</div></section> : null)}</div> : <EmptyState title="Belum ada konten milikmu" description="Buat rencana konten atau ambil ide dari halaman Ide Konten. Konten yang menjadi milikmu akan otomatis masuk ke halaman ini." href="/contents/new" action="Buat konten" />}
  </div>;
}
