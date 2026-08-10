import { requireUser } from "@/lib/auth/session";
import { listCompanies, listFormats, listGoals, listPillars, listPlatforms } from "@/features/master-data/repository";
import { ContentForm } from "@/features/contents/ContentForm";
import { createDraftContentAction } from "@/features/contents/actions";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NewContentPage() {
  const [user, companies, pillars, goals, platforms, formats] = await Promise.all([
    requireUser(), listCompanies(true), listPillars(true), listGoals(true), listPlatforms(true), listFormats(true),
  ]);
  return <div className="page-wrap max-w-4xl">
    <PageHeader eyebrow="Rencanakan konten" title="Buat Rencana Konten" description={`Konten ini otomatis menjadi milik ${user.name}. Isi yang belum final boleh dilengkapi sambil berjalan.`} />
    {!companies.length ? <div className="card-pad mb-4 border-amber-200 bg-amber-50 text-sm text-amber-800">Admin perlu menambahkan minimal satu perusahaan dari Pengaturan sebelum tim membuat konten.</div> : null}
    <div className="card-pad"><ContentForm companies={companies} pillars={pillars} goals={goals} platforms={platforms} formats={formats} action={createDraftContentAction} submitLabel="Simpan rencana" /></div>
  </div>;
}
