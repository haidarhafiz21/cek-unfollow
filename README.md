# Cek Unfollow

Periksa siapa yang tidak follow balik, akun mutual, dan akun yang berhenti mengikuti di Instagram.

**Buka:** https://haidarhafiz21.github.io/cek-unfollow/

## Cara pakai

**Komputer (Chrome/Edge)**
1. Seret tombol **Cek Unfollow** di halaman ke bookmark bar (`Ctrl+Shift+B` jika tidak terlihat).
2. Buka instagram.com dan login.
3. Klik bookmark **Cek Unfollow**. Hasil muncul di atas halaman Instagram.

**Android (Chrome) / iPhone (Safari)**: ikuti panduan di halaman (pilih perangkat di tab **Langsung**).

**Alternatif tanpa bookmark**: tab **Unggah file**, gunakan file ekspor resmi dari Instagram
(Pusat Akun → Informasi dan izin Anda → Ekspor informasi Anda → Pengikut dan mengikuti, format JSON).

## Privasi

- Password tidak pernah diminta. Script memakai sesi login Instagram yang sudah ada di browser.
- Semua data diproses di browser pengguna dan tidak dikirim ke server mana pun.
- Riwayat pemeriksaan (untuk mendeteksi siapa yang berhenti mengikuti) disimpan di `localStorage` browser masing-masing.

## Catatan

- Gunakan secukupnya (1–2 kali sehari). Permintaan yang terlalu sering dapat membuat Instagram membatasi akun sementara.
- Script memakai endpoint internal Instagram web yang dapat berubah sewaktu-waktu.
- Tidak berafiliasi dengan Instagram atau Meta.

## Struktur

| File | Isi |
| --- | --- |
| `index.html` | Halaman utama |
| `styles.css` | Tampilan halaman |
| `app.js` | Logika halaman, mode unggah file, pembuat bookmarklet |
| `cekunfollow.js` | Script yang dijalankan di instagram.com (isi bookmarklet) |
