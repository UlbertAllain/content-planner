import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-blue-600">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Halaman yang kamu cari mungkin sudah dipindahkan atau tidak tersedia.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Kembali ke ringkasan</Link>
      </div>
    </main>
  );
}
