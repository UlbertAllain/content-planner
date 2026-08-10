import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[#15233e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-sm font-semibold tracking-[0.18em] text-blue-200">NEXTY CONTENT</div>
        <div className="max-w-xl">
          <p className="text-sm font-medium text-blue-200">Ruang kerja divisi Media</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.08] tracking-[-0.04em]">Dari ide sampai tayang, semuanya lebih rapi.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Rencanakan konten untuk beberapa perusahaan, kerjakan milikmu sendiri, pantau kalender bersama, dan simpan hasilnya dalam satu tempat.</p>
        </div>
        <p className="text-xs text-slate-400">Sistem internal · Divisi Media</p>
      </section>

      <section className="grid place-items-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="text-sm font-semibold tracking-[0.15em] text-blue-600 lg:hidden">NEXTY CONTENT</div>
          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Selamat datang kembali</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Masuk menggunakan akun yang sudah dibuat oleh Admin.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
