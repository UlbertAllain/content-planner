# Nexty Content Planner

Shared content planner untuk divisi Media yang menangani beberapa perusahaan/brand dalam satu kalender. Sistem sengaja dibuat ringan untuk tim kecil: orang yang membuat rencana otomatis menjadi pemilik konten dan mengerjakannya sendiri sampai tayang.

## Teknologi

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Firebase Authentication
- Cloud Firestore + Firebase Admin SDK
- Cloudinary
- Zod
- date-fns

## Role

Hanya ada dua hak akses:

- `ADMIN` — mengelola semua konten, anggota, dan data pengaturan.
- `MEDIA_TEAM` — membuat/mengelola konten sendiri, melihat konten anggota lain, dan memberi catatan.

Data user versi lama dengan role `MEDIA_LEAD` atau `MEMBER` otomatis dibaca sebagai `MEDIA_TEAM`, jadi tidak perlu migrasi manual role sebelum login. Saat profil user disimpan ulang dari menu Tim, role baru akan tersimpan permanen.

Menu **Tim** dan **Pengaturan** hanya tersedia untuk Admin dan route-nya juga dilindungi server-side.

## Alur konten

```text
Draft
 ↓
Sedang Dikerjakan
 ↓
Siap Tayang
 ↓
Terjadwal
 ↓
Sudah Tayang
```

Konten dapat dibatalkan dan kemudian diarsipkan.

### Kepemilikan

- Saat anggota membuat rencana, `ownerId` otomatis memakai UID pembuat.
- Pemilik dapat mengubah isi, aset, jadwal, dan status kontennya sendiri.
- Anggota lain hanya bisa melihat dan memberi catatan.
- Admin dapat mengelola semua konten aktif.
- Konten hasil migrasi lama yang tidak memiliki PIC dapat diambil dengan tombol **Jadikan konten saya**.

## Ide Konten Publik

Halaman `/` adalah halaman publik untuk mengirim ide tanpa login. Form hanya meminta:

- Perusahaan
- Ide/topik
- Penjelasan (opsional)
- Nama pengirim (opsional)

Publik tidak menentukan jadwal, platform, jenis konten, atau PIC. Kiriman masuk ke collection `contentIdeas` dengan status `NEW`.

Di `/ideas`, Tim Media dapat:

- melihat ide publik dan ide internal;
- mencatat ide internal tanpa membuat planning;
- memilih **Jadikan konten saya**, yang membuat Draft baru dan otomatis menjadikan user tersebut sebagai pemilik;
- mengarsipkan ide yang tidak dipakai.

Form publik menggunakan API server, honeypot sederhana, validasi Zod, dan rate limit Firestore maksimal 5 kiriman per 10 menit per hash IP. Firestore tidak dibuka langsung ke publik.

## Perusahaan & data pendukung

Admin mengelola dari **Pengaturan**:

1. Perusahaan
2. Kategori Konten
3. Tujuan Konten
4. Platform
5. Jenis Konten

Contoh perusahaan:

- Nexty Labs
- Lunar Konstruksi
- Yuk Jadi Legal

## Collection Firestore

```text
users
companies
contentIdeas
contents
contentAssets
contentComments
contentPillars
contentGoals
platforms
formats
activities
publicIdeaRateLimits
```

`contents` tetap menjadi source of truth untuk Calendar, Alur Konten, Pekerjaan Saya, dan Semua Konten. `contentIdeas` sengaja terpisah karena ide belum menjadi rencana produksi.

## Struktur source

```text
app/
  (auth)/
  (workspace)/
  api/public/ideas/
  api/cloudinary/

components/
features/
  users/
  ideas/
  contents/
  assets/
  comments/
  activities/
  master-data/

lib/
tools/migration/
```

Flow backend bisnis:

```text
Page / UI
   ↓
Server Action / API Route
   ↓
Service / Business Rule
   ↓
Repository
   ↓
Firestore / Cloudinary
```

# Setup

## 1. Install

```bash
npm install
```

## 2. Environment

```powershell
Copy-Item .env.example .env.local
```

Isi credential sendiri:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_COOKIE_NAME=nexty_content_session
APP_TIME_ZONE=Asia/Jakarta

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Jangan commit `.env.local`.

## 3. Firebase Authentication

Aktifkan Email/Password. Admin pertama dibuat sekali dari Firebase Console lalu buat document:

```text
users/{FIREBASE_UID}
```

Contoh:

```json
{
  "name": "Admin Media",
  "email": "admin@example.com",
  "role": "ADMIN",
  "position": "Admin",
  "status": "ACTIVE"
}
```

Setelah Admin pertama login, anggota berikutnya dibuat langsung dari menu **Tim** tanpa copy UID. Gunakan role **Tim Media**.

## 4. Firestore rules & indexes

```powershell
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

Semua business read/write berjalan server-side menggunakan Firebase Admin SDK. Firestore client ditutup oleh rules.

## 5. Cloudinary

Isi Cloud Name, API Key, dan API Secret di `.env.local`. API Secret hanya digunakan di server.

## 6. Data awal

Tidak ada seed. Admin isi sendiri lewat Pengaturan. Disarankan mulai dari **Perusahaan**, lalu Platform/Jenis/Kategori/Tujuan sesuai kebutuhan.

## 7. Jalankan

```powershell
npm run dev
```

- `/` → form ide publik
- `/login` → login Tim Media/Admin
- `/dashboard` → ruang kerja internal

## 8. Validasi sebelum deploy

```powershell
npm run typecheck
npm run lint
npm run build
```

# Migrasi Excel lama

Tool migrasi berada di `tools/migration/` dan hanya digunakan saat perpindahan awal dari workbook lama. Tidak ada menu import permanen di aplikasi.

Edit `tools/migration/migration.config.json`:

```json
{
  "companyName": "Nexty Labs",
  "allPlatforms": ["Instagram", "TikTok"]
}
```

Dry run:

```powershell
npm run migrate:legacy
```

Jika preview benar:

```powershell
npm run migrate:legacy -- --apply
```

Status Excel `Concept/IDEA` dan `PLANNED` masuk sebagai Draft; `Scripting/Editing` menjadi Sedang Dikerjakan; `Post` menjadi Sudah Tayang. Data performa Excel tidak diimpor karena modul Performa sudah dikeluarkan dari scope V1.
