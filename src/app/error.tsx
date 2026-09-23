"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] place-items-center p-6">
      <div className="card-pad max-w-lg text-center">
        <p className="text-sm font-semibold text-red-600">Terjadi kesalahan</p>
        <h1 className="mt-2 text-2xl font-semibold">Permintaan belum bisa diproses</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{error.message || "Silakan coba kembali."}</p>
        <button onClick={reset} className="btn-primary mt-6">Coba lagi</button>
      </div>
    </main>
  );
}
