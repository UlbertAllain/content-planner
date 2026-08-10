import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listIdeas } from "@/features/ideas/repository";
import { listCompanies } from "@/features/master-data/repository";
import { listUsers } from "@/features/users/repository";
import { archiveIdeaAction, convertIdeaToContentAction, createInternalIdeaAction } from "@/features/ideas/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatDateTime } from "@/lib/utils/date";

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [user, ideas, companies, users, params] = await Promise.all([requireUser(), listIdeas(), listCompanies(), listUsers(), searchParams]);
  const companyMap = new Map(companies.map((item) => [item.id, item]));
  const userMap = new Map(users.map((item) => [item.id, item]));
  const view = params.view === "used" || params.view === "archived" ? params.view : "new";
  const visible = ideas.filter((idea) => view === "new" ? idea.status === "NEW" : view === "used" ? idea.status === "USED" : idea.status === "ARCHIVED");
  const newCount = ideas.filter((idea) => idea.status === "NEW").length;

  return <div className="page-wrap">
    <PageHeader eyebrow="Kotak ide bersama" title="Ide Konten" description="Ide dari publik dan tim Media masuk ke sini terlebih dahulu. Ambil ide yang ingin kamu kerjakan, lalu lengkapi planning-nya sebagai konten milikmu." actions={<Link href="/" target="_blank" className="btn-secondary">Lihat form publik</Link>} />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/ideas" className={`rounded-xl px-3 py-2 text-sm font-semibold ${view === "new" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}>Ide baru ({newCount})</Link>
          <Link href="/ideas?view=used" className={`rounded-xl px-3 py-2 text-sm font-semibold ${view === "used" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}>Sudah dipakai</Link>
          <Link href="/ideas?view=archived" className={`rounded-xl px-3 py-2 text-sm font-semibold ${view === "archived" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}>Arsip</Link>
        </div>

        <div className="space-y-3">
          {visible.map((idea) => <article key={idea.id} className="card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">{companyMap.get(idea.companyId)?.shortName || companyMap.get(idea.companyId)?.name || "Perusahaan"}</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">{idea.title}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{idea.source === "PUBLIC" ? "Dari publik" : "Dari tim"}</span>
            </div>
            {idea.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{idea.description}</p> : null}
            <p className="mt-3 text-xs text-slate-400">{idea.source === "PUBLIC" ? (idea.senderName || "Anonim") : (userMap.get(idea.createdBy || "")?.name || "Tim Media")} · {formatDateTime(idea.createdAt)}</p>
            {idea.status === "NEW" ? <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <form action={convertIdeaToContentAction.bind(null, idea.id)}><button className="btn-primary">Jadikan konten saya</button></form>
              <form action={archiveIdeaAction.bind(null, idea.id)}><button className="btn-secondary">Arsipkan</button></form>
            </div> : null}
            {idea.status === "USED" && idea.convertedContentId ? <div className="mt-4 border-t border-slate-100 pt-4"><Link href={`/contents/${idea.convertedContentId}`} className="text-sm font-semibold text-blue-600">Buka konten hasil ide →</Link></div> : null}
          </article>)}
          {!visible.length ? <div className="card-pad py-12 text-center text-sm text-slate-400">Belum ada ide pada bagian ini.</div> : null}
        </div>
      </section>

      <aside className="card-pad h-fit xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Ide dari tim</p>
        <h2 className="mt-1 section-title">Catat ide cepat</h2>
        <p className="muted mt-1">Tidak perlu jadwal atau platform. Kalau nanti dipilih, ide baru diubah menjadi rencana konten.</p>
        <form action={createInternalIdeaAction} className="mt-5 space-y-3">
          <div><label className="label">Perusahaan</label><select className="field" name="companyId" required defaultValue=""><option value="" disabled>Pilih perusahaan</option>{companies.filter((item) => item.isActive).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
          <div><label className="label">Ide / topik</label><input className="field" name="title" minLength={3} maxLength={180} required placeholder="Tulis ide singkat" /></div>
          <div><label className="label">Catatan <span className="font-normal text-slate-400">(opsional)</span></label><textarea className="field min-h-28" name="description" maxLength={2500} placeholder="Tambahkan konteks jika perlu" /></div>
          <button className="btn-secondary w-full">Simpan ide</button>
        </form>
        <p className="mt-4 text-[11px] leading-5 text-slate-400">Login sebagai {user.name}. Ide yang disimpan di sini tetap bisa diambil oleh anggota Media mana pun.</p>
      </aside>
    </div>
  </div>;
}
