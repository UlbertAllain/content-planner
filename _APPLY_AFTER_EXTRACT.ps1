$ErrorActionPreference = "Stop"

$obsolete = @(
  "app/(workspace)/performance",
  "features/metrics",
  ".next"
)

foreach ($path in $obsolete) {
  if (Test-Path $path) { Remove-Item -Recurse -Force $path }
}

Write-Host "Update v1.0.7 diterapkan. Jalankan npm run dev." -ForegroundColor Green
