import type { Company, ContentFormat, ContentGoal, ContentPillar, Platform } from "@/features/master-data/types";
import type { Content } from "./types";
import { toDateInputValue } from "@/lib/utils/date";

export function ContentForm({
  content,
  companies,
  pillars,
  goals,
  platforms,
  formats,
  action,
  submitLabel,
}: {
  content?: Content;
  companies: Company[];
  pillars: ContentPillar[];
  goals: ContentGoal[];
  platforms: Platform[];
  formats: ContentFormat[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Perusahaan</label>
          <select className="field" name="companyId" defaultValue={content?.companyId || ""} required>
            <option value="" disabled>Pilih perusahaan</option>
            {companies.filter((item) => item.isActive || item.id === content?.companyId).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Jadwal tayang <span className="font-normal text-slate-400">(opsional)</span></label>
          <input className="field" type="datetime-local" name="plannedPublishAt" defaultValue={toDateInputValue(content?.plannedPublishAt)} />
        </div>

        <div className="md:col-span-2">
          <label className="label">Topik / judul konten <span className="font-normal text-slate-400">(boleh dilengkapi nanti)</span></label>
          <input className="field" name="title" defaultValue={content?.title} placeholder="Contoh: 5 Kesalahan Branding UMKM" />
        </div>

        <div>
          <label className="label">Kategori konten <span className="font-normal text-slate-400">(opsional)</span></label>
          <select className="field" name="pillarId" defaultValue={content?.pillarId || ""}>
            <option value="">Tanpa kategori</option>
            {pillars.filter((item) => item.isActive || item.id === content?.pillarId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Tujuan konten <span className="font-normal text-slate-400">(opsional)</span></label>
          <select className="field" name="goalId" defaultValue={content?.goalId || ""}>
            <option value="">Belum ditentukan</option>
            {goals.filter((item) => item.isActive || item.id === content?.goalId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Jenis konten <span className="font-normal text-slate-400">(boleh dilengkapi nanti)</span></label>
          <select className="field" name="formatId" defaultValue={content?.formatId || ""}>
            <option value="">Belum ditentukan</option>
            {formats.filter((item) => item.isActive || item.id === content?.formatId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Platform <span className="font-normal text-slate-400">(bisa lebih dari satu)</span></label>
          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
            {platforms.filter((item) => item.isActive || content?.platformIds.includes(item.id)).map((platform) => (
              <label key={platform.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="platformIds" value={platform.id} defaultChecked={content?.platformIds.includes(platform.id)} />
                {platform.name}
              </label>
            ))}
            {!platforms.length ? <p className="text-xs text-slate-400">Tambahkan platform dari Pengaturan terlebih dahulu.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="label">Catatan / brief <span className="font-normal text-slate-400">(opsional)</span></label>
          <textarea className="field min-h-28" name="brief" defaultValue={content?.copy.brief} placeholder="Tuliskan arah konten, poin penting, atau hal yang perlu diingat." />
        </div>
        <div>
          <label className="label">Script / isi konten <span className="font-normal text-slate-400">(opsional)</span></label>
          <textarea className="field min-h-44" name="script" defaultValue={content?.copy.script} placeholder="Tulis script video, isi carousel, atau draft materi konten di sini." />
        </div>
        <div>
          <label className="label">Caption <span className="font-normal text-slate-400">(opsional)</span></label>
          <textarea className="field min-h-36" name="caption" defaultValue={content?.copy.caption} placeholder="Caption final atau draft caption." />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
