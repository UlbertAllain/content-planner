# Migrasi Content Planner Excel Lama

Tool sekali pakai untuk memindahkan `CONTENT PLANNER NEXTY .xlsx` ke sistem baru.

Analisis workbook:

- 23 baris sumber
- 20 konten unik setelah deduplikasi
- Duplicate lintas sheet sudah digabung

## Sebelum menjalankan

1. Pastikan Firebase Admin di `.env.local` valid.
2. Tambahkan anggota tim dari menu Team jika ingin nama PIC lama terhubung otomatis.
3. Edit `migration.config.json`.
4. Isi `companyName` sesuai pemilik workbook lama.
5. Isi arti platform `All` pada `allPlatforms`.

## Jalankan

Dry run:

```powershell
npm run migrate:legacy
```

Import:

```powershell
npm run migrate:legacy -- --apply
```

PIC kosong/tidak ditemukan tidak membatalkan import. Konten tersebut masuk tanpa pemilik dan dapat diambil lewat tombol **Jadikan konten saya**.

Script bersifat idempotent melalui `legacyImportKey`.

Catatan v1.0.7: kolom evaluasi/view/like/comment/share dari Excel tidak lagi ditulis ke Firestore karena modul Performa sudah dikeluarkan dari scope aplikasi.
