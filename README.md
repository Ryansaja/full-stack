# Paved - Full-Stack Website Template & CMS

Selamat datang di repository **Paved**! Ini adalah template website modern bergaya Neo-Retro / Urban Pop yang sudah dilengkapi dengan sistem manajemen konten (CMS) sederhana namun powerfull. Proyek ini dibangun menggunakan **Node.js, Express, dan MySQL**.

## ✨ Fitur Utama

- **CMS Dashboard**: Kelola artikel, produk, event, iklan, dan pesan Red Letter melalui satu dashboard.
- **Clean URLs**: Navigasi rapi tanpa ekstensi `.html` (misal: `/articles` alih-alih `/articles.html`).
- **Sistem Pengajuan Konten**: User bisa mengirimkan artikel dan event yang nantinya akan dimoderasi oleh admin.
- **Spotify Integration**: Fitur "Red Letter" yang terintegrasi dengan Spotify API untuk mencari lagu dan lagu favorit.
- **Responsive Design**: Tampilan yang optimal di berbagai perangkat (Mobile & Desktop).
- **Security**: Dilengkapi dengan JWT Authentication, enkripsi password Bcrypt, dan Rate Limiting untuk mencegah brute force.
- **SEO Ready**: Dilengkapi dengan `robots.txt`, `sitemap.xml`, dan meta tags yang optimal.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Backend**: Node.js, Express.js.
- **Database**: MySQL.
- **Autentikasi**: JSON Web Token (JWT) & Bcrypt.
- **Upload File**: Multer.
- **Integrasi**: Spotify API.

---

## 🚀 Cara Instalasi

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

### 1. Clone Repository
```bash
git clone https://github.com/Ryansaja/Article_Websites.git
cd paved
```

### 2. Instal Dependencies
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).
```bash
npm install
```

### 3. Konfigurasi Database
1. Buat database baru di MySQL (misalnya beri nama `paved_db` atau `red_letter_db`).
2. Impor schema database dari file `schema.sql`:
   ```bash
   mysql -u user_kamu -p nama_db < schema.sql
   ```
3. Jalankan migrasi tambahan:
   ```bash
   node migrate.js
   ```

### 4. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` (atau `.env.local` jika di lokal):
```bash
cp .env.example .env
```
Buka file `.env` dan lengkapi data konfigurasi berikut:
- **Database**: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- **Admin**: Tentukan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` (akan otomatis dibuat saat pertama kali dijalankan).
- **Security**: Masukkan `JWT_SECRET` (bisa dibuat dengan `openssl rand -base64 32`).
- **Spotify**: Masukkan `SPOTIFY_CLIENT_ID` dan `SPOTIFY_CLIENT_SECRET` dari [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

### 5. Jalankan Aplikasi
Untuk mode pengembangan (mendukung auto-restart):
```bash
npm run dev
```
Atau untuk menjalankan biasa:
```bash
npm start
```
Aplikasi akan berjalan di `http://localhost:5000` (atau port sesuai `.env`).

---

## 📁 Struktur Folder

```text
├── api/                # Konfigurasi atau serverless functions (jika ada)
├── public/             # File statis (HTML, CSS, JS Frontend)
│   ├── assets/         # Gambar, Icon, dll.
│   └── admin.html      # Halaman Dashboard Admin
├── src/                # Source code backend
│   ├── config/         # Konfigurasi Database & Env
│   ├── controllers/    # Logika bisnis per fitur
│   ├── middlewares/    # Auth & Rate Limit protection
│   ├── routes/         # Definisi endpoint API
│   └── utils/          # Fungsi pembantu (Sanitasi, dll.)
├── uploads/            # Tempat penyimpanan file yg di-upload
├── migrate.js          # Script migrasi database
└── schema.sql          # Struktur database lengkap
```

## 🔒 Akses Admin

Setelah server berjalan, Anda bisa mengakses dashboard admin di:
`http://localhost:5000/admin`

Akses masuk menggunakan kredensial yang Anda tentukan di file `.env`.

---

## 🤝 Kontribusi

Kontribusi selalu terbuka! Jika Anda ingin meningkatkan fitur atau memperbaiki bug, silakan buat *Pull Request* atau buka *Issue*.

---

## 📄 Lisensi

Project ini dilisensikan di bawah [ISC License](LICENSE).

---
*Dibuat dengan ❤️ untuk komunitas.*
