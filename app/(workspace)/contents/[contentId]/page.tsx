import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { canControlContent, canEditContent, canManagePublishedContent } from "@/lib/permissions/content-access";
import { findContentById } from "@/features/contents/repository";
import { listUsers } from "@/features/users/repository";
import { listCompanies, listFormats, listGoals, listPillars, listPlatforms } from "@/features/master-data/repository";
import { listContentAssets } from "@/features/assets/repository";
import { listComments } from "@/features/comments/repository";
import { listActivities } from "@/features/activities/repository";
import { ContentForm } from "@/features/contents/ContentForm";
import { activityLabel } from "@/features/contents/labels";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatContentSchedule, formatDateTime, toDateInputValue } from "@/lib/utils/date";
import { archiveContentAction, cancelContentAction, claimContentAction, markPublishedAction, markReadyAction, permanentlyDeleteContentAction, rescheduleContentFormAction, restoreContentAction, scheduleContentAction, startContentAction, updateContentAction } from "@/features/contents/actions";
import { addExternalAssetAction } from "@/features/assets/actions";
import { CloudinaryUploader } from "@/features/assets/CloudinaryUploader";
import { AssetPreviewCard } from "@/features/assets/AssetPreviewCard";
import { createContentCommentAction, deleteCommentAction } from "@/features/comments/actions";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"><span className="text-xs text-slate-500">{label}</span><span className="text-right text-sm font-medium text-slate-800">{value || "—"}</span></div>;
}

export default async function ContentDetailPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const [content, user, users, companies, pillars, goals, platforms, formats, assets, comments, activities] = await Promise.all([
    findContentById(contentId), requireUser(), listUsers(), listCompanies(), listPillars(), listGoals(), listPlatforms(), listFormats(),
    listContentAssets(contentId), listComments("CONTENT", contentId), listActivities("CONTENT", contentId, 60),
  ]);
  if (!content) notFound();
  const admin = isAdmin(user);
  const userMap = new Map(users.map((item) => [item.id, item]));
  const companyMap = new Map(companies.map((item) => [item.id, item]));
  const pillarMap = new Map(pillars.map((item) => [item.id, item]));
  const goalMap = new Map(goals.map((item) => [item.id, item]));
  const platformMap = new Map(platforms.map((item) => [item.id, item]));
  const formatMap = new Map(formats.map((item) => [item.id, item]));
  const editable = canEditContent(user, content);
  const controllable = canControlContent(user, content);
  const canManagePublished = canManagePublishedContent(user, content);

  return <div className="page-wrap max-w-[1280px]">
    <PageHeader eyebrow={companyMap.get(content.companyId || "")?.name || "Perusahaan belum dipilih"} title={content.title || "Topik belum ditentukan"} description={`${content.ownerId ? userMap.get(content.ownerId)?.name || "Pemilik tidak ditemukan" : "Belum ada pemilik"} · ${formatContentSchedule(content.plannedPublishAt, content.scheduleHasTime)}`} actions={<div className="flex flex-wrap gap-2"><StatusBadge status={content.status} /><Link href="/contents" className="btn-secondary">Kembali</Link></div>} />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {!content.archivedAt ? <section className="card-pad"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="section-title">Langkah berikutnya</h2><p className="muted mt-1">Pemilik konten mengatur progresnya sendiri. Anggota lain tetap bisa melihat dan memberi catatan.</p></div><div className="flex flex-wrap gap-2">
          {!content.ownerId ? <form action={claimContentAction.bind(null, content.id)}><button className="btn-primary">Jadikan konten saya</button></form> : null}
          {content.status === "DRAFT" && controllable ? <form action={startContentAction.bind(null, content.id)}><button className="btn-primary">Mulai dikerjakan</button></form> : null}
          {content.status === "IN_PROGRESS" && controllable ? <form action={markReadyAction.bind(null, content.id)}><button className="btn-primary">Tandai siap tayang</button></form> : null}
          {content.status === "READY" && controllable ? <form action={scheduleContentAction.bind(null, content.id)}><button className="btn-primary">Jadwalkan</button></form> : null}
          {!['PUBLISHED','CANCELLED'].includes(content.status) && controllable ? <form action={cancelContentAction.bind(null, content.id)}><button className="btn-secondary">Batalkan</button></form> : null}
          {['PUBLISHED','CANCELLED'].includes(content.status) && canManagePublished ? <form action={archiveContentAction.bind(null, content.id)}><button className="btn-secondary">Arsipkan</button></form> : null}
        </div></div>
        {content.status === "READY" && !content.plannedPublishAt && controllable ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Isi jadwal tayang terlebih dahulu sebelum konten dapat dijadwalkan.</p> : null}
        {content.status === "SCHEDULED" && controllable ? <form action={markPublishedAction.bind(null, content.id)} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2"><div><label className="label">Waktu tayang sebenarnya</label><input className="field" type="datetime-local" name="publishedAt" required defaultValue={toDateInputValue(new Date())} /></div><div><label className="label">Link konten <span className="font-normal text-slate-400">(opsional)</span></label><input className="field" name="publishedUrl" placeholder="https://..." /></div><div className="md:col-span-2"><button className="btn-primary">Tandai sudah tayang</button></div></form> : null}
        </section> : <section className="card-pad flex flex-wrap items-center justify-between gap-3"><div><h2 className="section-title">Konten diarsipkan</h2><p className="muted mt-1">Konten tidak lagi muncul di daftar aktif.</p></div><div className="flex gap-2">{(admin || content.ownerId === user.id) ? <form action={restoreContentAction.bind(null, content.id)}><button className="btn-secondary">Pulihkan</button></form> : null}{admin ? <form action={permanentlyDeleteContentAction.bind(null, content.id)}><button className="btn-danger">Hapus permanen</button></form> : null}</div></section>}

        <section className="card-pad"><div className="mb-4"><h2 className="section-title">Isi Konten</h2><p className="muted mt-1">{editable ? "Kamu dapat mengubah konten ini karena kamu pemiliknya atau Admin." : "Mode lihat saja. Hanya pemilik konten atau Admin yang dapat mengubah isinya."}</p></div>{editable ? <ContentForm content={content} companies={companies} pillars={pillars} goals={goals} platforms={platforms} formats={formats} action={updateContentAction.bind(null, content.id)} submitLabel="Simpan perubahan" /> : <div className="space-y-4 text-sm text-slate-700"><div><p className="text-xs font-semibold uppercase text-slate-400">Catatan / brief</p><p className="mt-1 whitespace-pre-wrap">{content.copy.brief || "Belum ada catatan."}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Script / isi</p><p className="mt-1 whitespace-pre-wrap">{content.copy.script || "Belum ada script."}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Caption</p><p className="mt-1 whitespace-pre-wrap">{content.copy.caption || "Belum ada caption."}</p></div></div>}</section>

        <section className="card-pad">
          <div>
            <h2 className="section-title">File & Referensi</h2>
            <p className="muted mt-1">Gambar dan video yang diunggah langsung ditampilkan di sini supaya progres konten bisa dicek tanpa membuka file satu per satu.</p>
          </div>
          {assets.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {assets.map((asset) => (
                <AssetPreviewCard key={asset.id} asset={asset} editable={editable} contentId={content.id} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
              <p className="text-sm font-medium text-slate-600">Belum ada file atau referensi.</p>
              <p className="mt-1 text-xs text-slate-400">Upload hasil desain, video, atau tambahkan tautan referensi saat sudah tersedia.</p>
            </div>
          )}
          {editable ? (
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
              <CloudinaryUploader contentId={content.id} />
              <form action={addExternalAssetAction.bind(null, content.id)} className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
                <select className="field" name="type">
                  <option value="REFERENCE">Referensi</option>
                  <option value="WORKING_FILE">File kerja</option>
                  <option value="FINAL_OUTPUT">Hasil akhir</option>
                </select>
                <input className="field" name="label" required placeholder="Nama tautan" />
                <input className="field" name="url" required placeholder="https://..." />
                <button className="btn-secondary">Tambah</button>
              </form>
            </div>
          ) : null}
        </section>

        <section className="card-pad"><h2 className="section-title">Catatan Tim</h2><p className="muted mt-1">Semua anggota boleh memberi masukan. Hanya pemilik yang dapat mengubah isi kontennya.</p><div className="mt-4 space-y-3">{comments.map((comment)=><div key={comment.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{userMap.get(comment.authorId)?.name || "Pengguna"}</p><p className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</p></div>{!comment.deletedAt && (admin || comment.authorId === user.id) ? <form action={deleteCommentAction.bind(null, content.id, comment.id)}><button className="text-xs text-red-600">Hapus</button></form> : null}</div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.deletedAt ? "Catatan telah dihapus." : comment.message}</p></div>)}</div>{!content.archivedAt ? <form action={createContentCommentAction.bind(null, content.id)} className="mt-4 border-t border-slate-100 pt-4"><textarea className="field min-h-24" name="message" required placeholder="Tulis masukan atau catatan..." /><button className="btn-secondary mt-2">Kirim catatan</button></form> : null}</section>
      </div>

      <aside className="space-y-5">
        <section className="card-pad"><h2 className="section-title">Ringkasan</h2><div className="mt-3"><Row label="Perusahaan" value={companyMap.get(content.companyId || "")?.name} /><Row label="Pemilik" value={content.ownerId ? userMap.get(content.ownerId)?.name : "Belum ada pemilik"} /><Row label="Kategori" value={pillarMap.get(content.pillarId || "")?.name} /><Row label="Tujuan" value={goalMap.get(content.goalId || "")?.name} /><Row label="Jenis" value={formatMap.get(content.formatId || "")?.name} /><Row label="Platform" value={content.platformIds.map((id)=>platformMap.get(id)?.name).filter(Boolean).join(", ") || undefined} /><Row label="Jadwal" value={formatContentSchedule(content.plannedPublishAt, content.scheduleHasTime)} />{content.publishedUrl ? <Row label="Link tayang" value={<a className="text-blue-600" href={content.publishedUrl} target="_blank" rel="noreferrer">Buka konten</a>} /> : null}</div></section>
        {!content.archivedAt && controllable && ["DRAFT","IN_PROGRESS","READY","SCHEDULED"].includes(content.status) ? <section className="card-pad"><h2 className="section-title">Ubah Jadwal</h2><form action={rescheduleContentFormAction.bind(null, content.id)} className="mt-3 space-y-3"><input className="field" type="datetime-local" name="plannedPublishAt" required defaultValue={toDateInputValue(content.plannedPublishAt)} /><button className="btn-secondary w-full">Simpan jadwal</button></form></section> : null}
        <section className="card-pad"><h2 className="section-title">Riwayat</h2><div className="mt-3 space-y-3">{activities.map((activity)=><div key={activity.id} className="border-l-2 border-slate-100 pl-3"><p className="text-sm font-medium text-slate-700">{activityLabel(activity.action)}</p><p className="mt-1 text-xs text-slate-400">{userMap.get(activity.actorId)?.name || "Sistem"} · {formatDateTime(activity.createdAt)}</p></div>)}</div></section>
      </aside>
    </div>
  </div>;
}
