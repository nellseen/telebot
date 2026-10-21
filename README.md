# Telegram Bot Manager (TBM)

Aplikasi dashboard web full-stack modern untuk membuat, menjalankan, menghentikan, memantau, dan mengonfigurasi banyak bot Telegram secara simultan melalui satu panel kontrol yang ringan, aman, dan kompatibel dengan **Android Termux** serta server Linux biasa.

Tidak memerlukan Docker, PostgreSQL, atau Redis — didukung penuh oleh SQLite persisten, Prisma ORM, runtime grammY, dan WebSocket real-time.

---

## 📑 Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Persyaratan Sistem](#persyaratan-sistem)
4. [Instalasi Cepat](#instalasi-cepat)
5. [Alur Penggunaan Pertama Kali](#alur-penggunaan-pertama-kali)
6. [Mendapatkan Token Bot dari BotFather](#mendapatkan-token-bot-dari-botfather)
7. [Template Bot Bawaan & Perintah](#template-bot-bawaan--perintah)
8. [Panduan Khusus Android & Termux](#panduan-khusus-android--termux)
9. [Backup & Restore Database](#backup--restore-database)
10. [Troubleshooting & Solusi Masalah](#troubleshooting--solusi-masalah)
11. [Menjalankan Pengujian (Tests)](#menjalankan-pengujian-tests)
12. [Perintah NPM Tersedia](#perintah-npm-tersedia)

---

## 1. Fitur Utama

- **Multi-Bot Runtime Lifecycle**: Jalankan puluhan bot Telegram sekaligus. Tiap bot memiliki siklus hidup independen (Start, Stop, Restart) dengan long polling terisolasi.
- **Auto-Start Recovery**: Bot dengan konfigurasi `autoStart: true` otomatis dijalankan kembali saat server atau ponsel dinyalakan ulang.
- **Validasi Token Instan**: Token Telegram diverifikasi langsung dengan Telegram Bot API (`getMe`) sebelum disimpan ke database.
- **Keamanan Tingkat Tinggi**:
  - Enkripsi token menggunakan **AES-256-GCM** dengan salt dan authentication tag.
  - Kunci enkripsi tersimpan terpisah di environment lokal (`ENCRYPTION_KEY`).
  - Hashing sandi menggunakan **PBKDF2** (100.000 iterasi, SHA-512) tanpa kompilasi native C++ yang berat.
  - Perlindungan anti brute-force login.
  - Sanitasi otomatis seluruh kredensial pada log dan tampilan UI.
- **Template Bot Interaktif Bawaan**:
  - `/start`: Sambutan kustom HTML + menu inline interaktif.
  - `/help`: Daftar perintah aktif dinamis.
  - `/id`: Informasi user ID dan chat ID.
  - `/ping`: Pengukuran latensi pemrosesan lokal.
  - `/about`: Informasi bot dan engine tanpa membocorkan rahasia.
  - `/menu`: Keyboard inline interaktif lengkap dengan navigasi Beranda, Bantuan, Status, dan Tutup.
- **Middleware Proteksi**: Rate limiting per user/chat (anti spam) dan deduplikasi update ID.
- **Live Logs & WebSocket Telemetry**: Streaming log pemrosesan update dan perubahan status bot secara langsung tanpa perlu refresh browser.
- **Backup Konsisten SQLite**: Snapshot database aman menggunakan perintah SQLite `VACUUM INTO` yang non-blocking.
- **100% Bebas Docker & Cloud DB**: Didesain khusus berjalan mulus di lingkungan terbatas seperti Termux Android.

---

## 2. Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser / Client UI                       │
│    (React 19 + Tailwind CSS + Lucide + WebSocket Client)     │
└──────────────┬───────────────────────────────▲───────────────┘
               │ HTTP REST (/api/*)            │ WS (/ws)
               ▼                               │
┌──────────────────────────────────────────────┴───────────────┐
│                    Express Backend Server                    │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Authentication, Brute-force Limiter & Session Store  │   │
│   └──────────────────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Bot Supervisor: State Machine, Backoff & Heartbeat   │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │ Lifecycle Management          │
│                              ▼                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Multi-Bot Workers (grammY Framework - Long Polling)  │   │
│   └──────────────────────────┬───────────────────────────┘   │
└──────────────────────────────┼───────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
     Telegram Bot API           SQLite Database (data/app.db)
  (https://api.telegram.org)     Prisma Schema & Migrations
```

---

## 3. Persyaratan Sistem

- **Node.js**: Versi **18.x, 20.x, atau 22.x** (disarankan Node.js 22 LTS).
- **NPM**: Versi 9.x atau 10.x.
- **OS**:
  - Android 8.0+ dengan aplikasi **Termux**.
  - Atau Linux (Ubuntu, Debian, Alpine, Fedora, Arch).
  - Atau macOS / Windows (WSL2).
- **RAM**: Minimal 256 MB RAM bebas.
- **Penyimpanan**: Minimal 100 MB ruang disk untuk dependencies dan data SQLite.

---

## 4. Instalasi Cepat

### Di Linux / Desktop / VPS:

```bash
# 1. Clone repository
git clone <url-repo>
cd telegram-bot-manager

# 2. Install dependensi
npm install

# 3. Jalankan setup wizard awal (membuat .env, direktori data, & migrasi SQLite)
npm run setup

# 4. Jalankan aplikasi
npm run dev
```

### Di Android Termux:

```bash
# 1. Update paket Termux dan install Node.js serta Git
pkg update -y
pkg install nodejs git -y

# 2. Aktifkan wakelock agar Termux tidak dimatikan Android saat layar mati
termux-wake-lock

# 3. Clone dan masuk ke folder project
git clone <url-repo>
cd telegram-bot-manager

# 4. Install dependensi
npm install

# 5. Jalankan setup otomatis
npm run setup

# 6. Jalankan aplikasi
npm run dev
```

Buka browser di ponsel Anda dan akses:
👉 **http://localhost:3000** (atau `http://IP-HP-ANDA:3000` dari laptop dalam jaringan Wi-Fi yang sama).

---

## 5. Alur Penggunaan Pertama Kali

1. **Inisialisasi Akun Administrator Pertama**:
   Saat pertama kali membuka dashboard, sistem akan mendeteksi bahwa belum ada akun. Anda akan diarahkan ke form *Inisialisasi Akun Administrator Pertama*. Buat username dan password kuat (minimal 6 karakter). Tidak ada akun default seperti `admin/admin` demi keamanan.
2. **Tambah Bot**:
   Klik tombol **"+ Tambah Bot Baru"** di dashboard atau halaman bot.
3. **Masukkan Token**:
   Isi Nama Bot dan tempelkan token Telegram yang Anda dapatkan dari **@BotFather**.
4. **Verifikasi Otomatis**:
   Sistem akan menghubungi Telegram Bot API untuk memverifikasi token, mengambil username (@botusername), mengenkripsi token dengan AES-256-GCM, dan menyimpannya.
5. **Jalankan Bot**:
   Klik tombol **"Jalankan"** pada kartu bot. Bot akan langsung aktif secara realtime!

---

## 6. Mendapatkan Token Bot dari BotFather

1. Buka aplikasi Telegram dan cari akun resmi **@BotFather** (dengan centang biru).
2. Kirim pesan `/newbot`.
3. Masukkan nama tampilan untuk bot Anda (misal: `Toko Saya Bot`).
4. Masukkan username bot (harus berakhiran `bot`, misal: `tokosaya_official_bot`).
5. BotFather akan memberikan token API berbentuk seperti:
   `7123456789:AAFlm3k_SampleToken1234567890abcdefgh`
6. Salin token tersebut dan tempelkan di form *Tambah Bot* pada Telegram Bot Manager.

---

## 7. Template Bot Bawaan & Perintah

Semua bot yang ditambahkan ke Telegram Bot Manager langsung memiliki kapabilitas bawaan:

| Perintah | Deskripsi | Konfigurasi Dashboard |
|---|---|---|
| `/start` | Mengirim sambutan dan membuka menu navigasi interaktif | Pesan dapat diubah di Pengaturan Bot |
| `/help` | Menampilkan panduan dan daftar perintah yang aktif | Dapat diaktifkan / dinonaktifkan |
| `/id` | Menampilkan User ID dan Chat ID pengguna | Bawaan aman |
| `/ping` | Mengukur respons latensi pemrosesan lokal bot | Pengukuran akurat |
| `/about` | Menampilkan informasi bot & status runtime | Bawaan aman |
| `/menu` | Menampilkan inline keyboard interaktif (Beranda, Bantuan, Status, Tutup) | Dapat diaktifkan / dinonaktifkan |

---

## 8. Panduan Khusus Android & Termux

Sistem operasi Android memiliki manajemen baterai yang agresif yang dapat membekukan proses latar belakang (background app freeze). Agar bot Anda tetap online terus-menerus:

1. **Gunakan Termux Wake Lock**:
   Sebelum menjalankan `npm run dev`, jalankan:
   ```bash
   termux-wake-lock
   ```
   Ini akan memunculkan notifikasi persisten Termux di status bar Android dan mencegah CPU masuk ke mode deep sleep.
2. **Kecualikan dari Optimasi Baterai**:
   Buka **Pengaturan Android** -> **Aplikasi** -> **Termux** -> **Baterai** -> Pilih **Tidak Dibatasi (Unrestricted)**.
3. **Kunci Aplikasi Termux di Recent Apps**:
   Buka menu Recent Apps di Android Anda dan tekan ikon gembok pada aplikasi Termux agar tidak tertutup saat tombol *Clear All* ditekan.

---

## 9. Backup & Restore Database

Database SQLite disimpan di file: `data/app.db`.

### Membuat Backup Manual:
- Melalui Dashboard: Buka tab **Diagnosa & Backup** -> Klik tombol **"Buat Backup Database Sekarang"**.
- Melalui Terminal:
  ```bash
  npm run db:backup
  ```
  File snapshot akan disimpan di folder `data/backups/manual-backup-*.db`.

### Memulihkan Database (Restore):
1. Hentikan server (`Ctrl + C`).
2. Salin file backup pilihan Anda menimpa `data/app.db`:
   ```bash
   cp data/backups/nama-file-backup.db data/app.db
   ```
3. Nyalakan kembali server dengan `npm run dev`.

---

## 10. Troubleshooting & Solusi Masalah

### Error 409: Conflict: terminated by other getUpdates request
**Penyebab**: Token bot yang sama sedang dijalankan di tempat lain (misalnya di server lama, laptop lain, atau bot polling lain).
**Solusi**: Pastikan tidak ada script atau instance bot lain yang menggunakan token tersebut. Kemudian klik tombol **"Restart"** di dashboard.

### Error 401: Unauthorized / Invalid Token
**Penyebab**: Token bot telah dicabut atau di-regenerate melalui BotFather.
**Solusi**: Periksa validitas token menggunakan tombol **"Cek"** pada kartu bot. Jika token sudah diganti di BotFather, hapus bot dan daftarkan kembali dengan token baru.

### Database Is Locked
**Penyebab**: Dua proses mencoba menulis ke file SQLite secara bersamaan.
**Solusi**: TBM menggunakan antrean transaksi terintegrasi dan mode WAL. Jika terjadi lock tak terduga, hentikan proses dengan `Ctrl+C` dan jalankan kembali `npm run dev`.

### Jalankan Pengecekan Mandiri (Doctor):
Untuk mendiagnosa integritas database, jaringan ke Telegram, dan ketersediaan Node:
```bash
npm run doctor
```

---

## 11. Menjalankan Pengujian (Tests)

Proyek ini dilengkapi dengan suite pengujian otomatis yang mencakup:
- Enkripsi & Dekripsi AES-256-GCM
- Masking token kredensial
- Hashing sandi PBKDF2
- Redaksi log terstruktur
- Registry template perintah Telegram
- Operasi tabel SQLite & integritas PRAGMA

Jalankan pengujian dengan:
```bash
npm run test
```

---

## 12. Perintah NPM Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run setup` | Menyiapkan `.env`, folder data, migrasi SQLite, dan generate Prisma |
| `npm run dev` | Menjalankan server full-stack (Express API + WebSocket + Bot Supervisor + Vite UI) |
| `npm run test` | Menjalankan suite pengujian unit & keamanan |
| `npm run doctor` | Memeriksa kesehatan database, memori, dan koneksi ke Telegram API |
| `npm run check-runtime` | Memeriksa kompatibilitas runtime dan deteksi Termux |
| `npm run db:backup` | Membuat backup atomik database SQLite secara langsung |
| `npm run build` | Melakukan build produksi frontend React |
| `npm run lint` | Melakukan pemeriksaan type safety TypeScript |

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT.
Dibuat dengan ❤️ untuk komunitas bot developer & pengguna Termux Android.
