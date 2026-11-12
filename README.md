# Cek Unfollow

Periksa siapa yang tidak follow balik, akun mutual, dan akun yang berhenti mengikuti di Instagram.

**Buka:** https://haidarhafiz21.github.io/cek-unfollow/
**Panduan lengkap (komputer, Android, iPhone):** https://haidarhafiz21.github.io/cek-unfollow/tutorial.html

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
- Halaman tidak memuat apa pun dari pihak ketiga (tanpa CDN/Google Fonts) dan dilindungi Content-Security-Policy.
  `vendor/jszip.min.js` (JSZip 3.10.1, MIT) disertakan langsung dan sudah dicocokkan dengan hash SRI resmi cdnjs.
- Script hanya melakukan permintaan **baca** (GET) ke Instagram; tidak ada aksi follow/unfollow/like.

## Pengaman akurasi

Agar tidak salah menuduh seseorang berhenti mengikuti:
- Jika jumlah pengikut yang diterima jauh lebih sedikit dari angka di profil, hasil tidak dicatat ke riwayat.
- Jika lebih dari 30% (minimal 20 akun) hilang sekaligus, perubahan ditahan sampai pengguna memilih **Tetap simpan**.
- Riwayat mode unggah hanya disimpan bila nama akun terdeteksi dari file ZIP asli; mode tempel tidak menyimpan riwayat.

## Catatan

- Gunakan secukupnya (1–2 kali sehari). Permintaan yang terlalu sering dapat membuat Instagram membatasi akun sementara.
- Script memakai endpoint internal Instagram web yang dapat berubah sewaktu-waktu.
- Tidak berafiliasi dengan Instagram atau Meta.

## Struktur

| File | Isi |
| --- | --- |
| `index.html` | Halaman utama |
| `tutorial.html`, `tutorial.js` | Halaman panduan per perangkat dan tanya jawab |
| `styles.css` | Tampilan halaman |
| `app.js` | Logika halaman, mode unggah file, pembuat bookmarklet |
| `cekunfollow.js` | Script yang dijalankan di instagram.com (isi bookmarklet) |
