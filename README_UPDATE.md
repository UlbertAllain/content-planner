# Update v1.1.0 - Mobile Performance

Extract isi ZIP ke root project dan overwrite file yang ada.

Lalu jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\_APPLY_AFTER_EXTRACT.ps1
npm run dev
```

Jika `npm ls firebase-admin` sudah menunjukkan `13.10.0`, tidak perlu menjalankan `npm install` lagi.
