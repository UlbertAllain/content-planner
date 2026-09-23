import { listCompanies } from "@/features/master-data/repository";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [companies, params] = await Promise.all([listCompanies(true), searchParams]);
  const sent = params.sent === "1";
  const rateLimited = params.error === "rate";
  const invalid = params.error === "invalid";

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-blue-600">NEXTY CONTENT</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">Punya ide konten? Kirim aja.</h1>
          <p className="mt-5 text-base leading-7 text-slate-600">Ide sederhana pun boleh. Pilih perusahaan yang kamu maksud, tulis topiknya, lalu tim Media akan mempertimbangkannya untuk content plan berikutnya.</p>
        </section>

        <section className="card-pad p-5 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Kirim Ide</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Cukup ceritakan idenya</h2>
            <p className="mt-1 text-sm text-slate-500">Tidak perlu menentukan tanggal, platform, atau siapa yang mengerjakan.</p>
          </div>

          {sent ? <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Makasih! Idenya sudah masuk ke tim Media.</div> : null}
          {rateLimited ? <div className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">Terlalu banyak ide dikirim dalam waktu singkat. Coba lagi beberapa menit lagi.</div> : null}
          {invalid ? <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">Ide belum bisa dikirim. Periksa kembali perusahaan dan isi idenya.</div> : null}

          {!companies.length ? (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Form ide belum tersedia karena Admin belum menambahkan perusahaan.</div>
          ) : (
            <form action="/api/public/ideas" method="post" className="mt-5 space-y-4">
              <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <div>
                <label className="label">Untuk perusahaan</label>
                <select className="field" name="companyId" required defaultValue="">
                  <option value="" disabled>Pilih perusahaan</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ide / topik</label>
                <input className="field" name="title" minLength={3} maxLength={180} required placeholder="Contoh: Bahas perbedaan CV dan PT untuk usaha kecil" />
              </div>
              <div>
                <label className="label">Penjelasan <span className="font-normal text-slate-400">(opsional)</span></label>
                <textarea className="field min-h-28" name="description" maxLength={2500} placeholder="Kalau perlu, tambahkan sedikit konteks supaya idenya lebih mudah dipahami." />
              </div>
              <div>
                <label className="label">Nama kamu <span className="font-normal text-slate-400">(opsional)</span></label>
                <input className="field" name="senderName" maxLength={100} placeholder="Boleh dikosongkan" />
              </div>
              <button className="btn-primary w-full">Kirim ide</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
