import { listContents } from "@/features/contents/repository";
import { listCompanies } from "@/features/master-data/repository";
import { listUsers } from "@/features/users/repository";
import type { ContentStatus } from "@/features/contents/types";
import { contentStatusLabels } from "@/features/contents/labels";
import { ContentCard } from "@/features/contents/ContentCard";
import { PageHeader } from "@/components/shared/PageHeader";

const columns: ContentStatus[] = ["DRAFT", "IN_PROGRESS", "READY", "SCHEDULED"];

export default async function BoardPage() {
  const [contents, companies, users] = await Promise.all([listContents({ limit: 300 }), listCompanies(), listUsers()]);
  const companyMap = new Map(companies.map((item) => [item.id, item.name]));
  const userMap = new Map(users.map((item) => [item.id, item.name]));

  return <div className="page-wrap max-w-none">
    <PageHeader eyebrow="Progres bersama" title="Alur Konten" description="Semua anggota bisa melihat progres. Perubahan hanya dapat dilakukan oleh pemilik konten atau Admin." />
    <div className="grid auto-cols-[285px] grid-flow-col gap-4 overflow-x-auto pb-4">
      {columns.map((status) => {
        const items = contents.filter((item) => item.status === status);
        return <section key={status} className="min-h-[520px] rounded-2xl border border-slate-200 bg-slate-100/65 p-3">
          <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-semibold text-slate-700">{contentStatusLabels[status]}</h2><span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">{items.length}</span></div>
          <div className="space-y-2.5">{items.map((content) => <ContentCard key={content.id} content={content} companyName={companyMap.get(content.companyId || "")} ownerName={userMap.get(content.ownerId || "")} />)}</div>
        </section>;
      })}
    </div>
  </div>;
}
