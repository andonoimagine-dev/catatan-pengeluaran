# Catatan Pengeluaran

Aplikasi web untuk mencatat pengeluaran harian rumah tangga. Dibangun dengan HTML, CSS, dan JavaScript murni — tanpa framework, tanpa build tool, tanpa server backend. Semua data tersimpan di browser (localStorage).

## Fitur

- **Catat pengeluaran** — tanggal, kategori, jumlah, dan catatan opsional; bisa diedit dan dihapus
- **Kategori fleksibel** — 8 kategori bawaan plus kategori kustom yang bisa ditambah/dihapus
- **Ringkasan otomatis** — total hari ini, total bulan aktif, dan sisa anggaran
- **Navigasi antar bulan** — lihat riwayat bulan sebelumnya lengkap dengan rincian per kategori
- **Tren 6 bulan terakhir** — bar perbandingan total per bulan, klik untuk pindah bulan
- **Anggaran bulanan** — batas total dan per kategori; indikator berubah amber saat mencapai 80% dan merah saat melewati batas
- **Backup & pindah data** — export JSON (backup lengkap) dan CSV (untuk Excel/Sheets), import JSON dengan pilihan gabung atau ganti semua
- **PWA** — bisa di-install di HP (Add to Home Screen) dan tetap berfungsi offline

## Menjalankan

Butuh web server statis sederhana (service worker tidak jalan lewat `file://`). Dua pilihan:

```powershell
# Windows (PowerShell) — server bawaan repo
.\server.ps1
```

```bash
# Alternatif jika ada Python
python -m http.server 8000
```

Lalu buka <http://localhost:8000>.

## Struktur

```
index.html      # Satu-satunya halaman
css/style.css   # Seluruh styling (CSS variables untuk tema)
js/app.js       # Seluruh logika aplikasi
manifest.json   # Manifest PWA
sw.js           # Service worker (cache-first)
icons/icon.svg  # Ikon aplikasi
server.ps1      # Server statis untuk development di Windows
```

## Catatan pengembangan

- Data di localStorage dengan 3 kunci: `catatan-pengeluaran-data` (transaksi), `catatan-pengeluaran-categories` (kategori kustom), `catatan-pengeluaran-budgets` (anggaran).
- Setelah mengubah `js/app.js` atau `css/style.css`, **naikkan versi cache** di `sw.js` (`catatan-pengeluaran-v1` → `-v2` dst.) agar pengguna lama mendapat versi baru — service worker melayani cache lebih dulu.
- Data hanya ada di satu browser. Anjurkan backup JSON berkala lewat seksi "Data & Backup" di aplikasi.
