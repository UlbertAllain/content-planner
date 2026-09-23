import { PageHeader } from "@/components/shared/PageHeader";
import { createUserAction, setUserPasswordAction, updateUserAction } from "@/features/users/actions";
import { userRoleLabels, userStatusLabels } from "@/features/users/labels";
import { listUsers } from "@/features/users/repository";
import type { UserRole, UserStatus } from "@/features/users/types";
import { requireRole } from "@/lib/auth/session";

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      {userRoleLabels[role]}
    </span>
  );
}

function StatusText({ status }: { status: UserStatus }) {
  return (
    <span className={`text-[11px] font-semibold ${status === "ACTIVE" ? "text-emerald-600" : "text-slate-400"}`}>
      {userStatusLabels[status]}
    </span>
  );
}

export default async function TeamPage() {
  await requireRole(["ADMIN"]);
  const users = await listUsers();
  const canManage = true;

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Anggota divisi Media"
        title="Tim Media"
        description="Khusus Admin untuk menambah akun dan mengelola anggota divisi Media."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="section-title">Daftar anggota</h2>
              <p className="mt-1 text-xs text-slate-500">{users.length} pengguna terdaftar</p>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">Belum ada anggota tim.</p>
              <p className="mt-1 text-sm text-slate-500">Admin dapat menambahkan pengguna dari formulir di samping.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <p className="mt-1 text-xs text-slate-400">{user.position || "Posisi belum diatur"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <RoleBadge role={user.role} />
                      <StatusText status={user.status} />
                    </div>
                  </div>

                  {canManage ? (
                    <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60">
                      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-slate-600">Kelola anggota</summary>
                      <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-2">
                        <form action={updateUserAction} className="space-y-3">
                          <input type="hidden" name="id" value={user.id} />
                          <div><label className="label">Nama</label><input className="field" name="name" defaultValue={user.name} required /></div>
                          <div>
                            <label className="label">Email login</label>
                            <input className="field" value={user.email} disabled />
                            <p className="mt-1 text-[11px] text-slate-400">Email login tidak diubah dari halaman ini.</p>
                          </div>
                          <div><label className="label">Posisi / pekerjaan</label><input className="field" name="position" defaultValue={user.position} placeholder="Contoh: Graphic Designer" /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="label">Hak akses</label>
                              <select className="field" name="role" defaultValue={user.role}>
                                <option value="ADMIN">Admin</option>
                                <option value="MEDIA_TEAM">Tim Media</option>
                              </select>
                            </div>
                            <div>
                              <label className="label">Status akun</label>
                              <select className="field" name="status" defaultValue={user.status}>
                                <option value="ACTIVE">Aktif</option>
                                <option value="INACTIVE">Nonaktif</option>
                              </select>
                            </div>
                          </div>
                          <button className="btn-secondary w-full">Simpan perubahan</button>
                        </form>

                        <form action={setUserPasswordAction} className="space-y-3 rounded-xl border border-slate-100 bg-white p-4">
                          <input type="hidden" name="id" value={user.id} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Atur ulang password</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Gunakan jika anggota lupa password atau perlu diberikan password baru.</p>
                          </div>
                          <div><label className="label">Password baru</label><input className="field" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
                          <div><label className="label">Ulangi password baru</label><input className="field" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></div>
                          <button className="btn-secondary w-full">Simpan password baru</button>
                        </form>
                      </div>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {canManage ? (
          <section className="card-pad h-fit xl:sticky xl:top-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">Tambah anggota</p>
              <h2 className="mt-1 section-title">Buat akun pengguna</h2>
              <p className="muted mt-1">Cukup isi data pengguna. Akun login dan ID internal dibuat otomatis oleh sistem.</p>
            </div>

            <form action={createUserAction} className="mt-5 space-y-3">
              <div><label className="label">Nama lengkap</label><input className="field" name="name" required placeholder="Nama anggota tim" /></div>
              <div><label className="label">Email login</label><input className="field" name="email" type="email" autoComplete="off" required placeholder="nama@nextylabs.com" /></div>
              <div><label className="label">Posisi / pekerjaan</label><input className="field" name="position" placeholder="Contoh: Graphic Designer" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hak akses</label>
                  <select className="field" name="role" defaultValue="MEDIA_TEAM">
                    <option value="ADMIN">Admin</option>
                    <option value="MEDIA_TEAM">Tim Media</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status akun</label>
                  <select className="field" name="status" defaultValue="ACTIVE">
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Informasi login pertama</p>
                <div><label className="label">Password sementara</label><input className="field" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
                <div className="mt-3"><label className="label">Ulangi password</label><input className="field" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">Berikan email dan password sementara ini kepada anggota untuk login.</p>
              </div>

              <button className="btn-primary w-full">Tambah pengguna</button>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}
