# Panduan Instalasi — SIM Donor Darah v2.0
**Backend:** Google Apps Script (REST API) · **Frontend:** GitHub Pages (HTML/CSS/JS statis)

Ada dua bagian: **A. Backend (Apps Script)** lalu **B. Frontend (GitHub Pages)**. Kerjakan berurutan.

---
## A. Backend — Google Apps Script

Anda sudah punya proyek Apps Script lama? Pakai proyek yang sama (data, folder, dan akun tetap aman).

1. Buka https://script.google.com dan buka proyek SIM Donor Darah Anda (atau buat **Proyek baru**).
2. Ganti isi `Code.gs` dengan isi berkas **`Kode.gs`** (v2.0).
3. **Hapus** file `Index`, `Stylesheet`, dan `JavaScript` (tidak dipakai lagi; tampilan pindah ke GitHub).
4. (Opsional) Project Settings → centang *Show "appsscript.json" manifest file* → ganti isinya dengan berkas `appsscript.json`.
5. Proyek baru saja? Jalankan **`setupAppEnvironment`** sekali (dropdown fungsi → Run → izinkan akses). Proyek lama: lewati.
6. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**
   (proyek baru: Deploy → New deployment → Web app → *Execute as: Me*, *Who has access: Anyone*).
7. **Salin URL Web App** yang berakhiran `/exec`.
8. Uji: tempel URL itu di browser. Harus muncul `{"success":true,"data":{"app":"SIM Donor Darah","versi":"2.0"}...}`.

> Setiap kali `Kode.gs` diubah, ulangi langkah 6 (New version). URL `/exec` tetap sama.

---
## B. Frontend — GitHub Pages

### 1. Ekstrak ZIP dan isi alamat backend
Ekstrak **SIM-Donor-Darah-Frontend.zip**. Hasilnya folder **`sim-donor-darah`**. Folder inilah **folder kerja Anda** — tempat `git init` nanti. Jangan masuk lebih dalam, jangan naik satu level.

Buka `sim-donor-darah\js\config.js` dengan Notepad dan ganti:
```js
const GAS_URL = 'GANTI_DENGAN_URL_EXEC_ANDA';
```
dengan URL `/exec` dari langkah A7 (tetap di dalam tanda kutip). Simpan.

### 2. Install Git (sekali saja)
- **Windows:** https://git-scm.com/download/win (pengaturan default). Lalu buka **PowerShell**.
- **Mac:** buka Terminal, ketik `git --version`, ikuti tawaran instalasi.
```bash
git --version
git config --global user.name "Nama Anda"
git config --global user.email "email@akun-github-anda.com"
```

### 3. Buat akun & repository GitHub
1. Daftar di https://github.com (username Anda menjadi bagian alamat situs: `username.github.io`).
2. Tombol **+ → New repository**. Nama: `sim-donor-darah`. Pilih **Public**. **Jangan** centang README / .gitignore / license. Klik **Create repository**.

### 4. Masuk ke folder kerja & periksa isinya
Windows: buka folder `sim-donor-darah` di File Explorer → klik address bar → ketik `powershell` → Enter.
```powershell
dir
```
Yang **harus terlihat:** `index.html`, folder `css`, folder `js`. Kalau yang terlihat justru folder bernama `sim-donor-darah` lagi, ketik `cd sim-donor-darah` lalu `dir` ulang. **Jangan lanjut sebelum `index.html` terlihat.**

### 5. Kirim ke GitHub (satu per satu)
```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/sim-donor-darah.git
git push -u origin main
```
(`git add .` — ada **titik** di akhir.) Saat diminta *Username* isi username GitHub; *Password* isi **Personal Access Token** (bukan password akun). Layar tampak kosong saat paste token — itu normal. Sukses bila muncul `* [new branch] main -> main`.

**Membuat token:** https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo** → Generate → salin `ghp_...` (hanya tampil sekali).

### 6. Aktifkan GitHub Pages
Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** · **/ (root)** → Save. Tunggu 1–2 menit, situs aktif di `https://USERNAME.github.io/sim-donor-darah/`.

### 7. Update di kemudian hari
```bash
git add .
git commit -m "Perubahan"
git push
```
Bila tampilan masih lama: **Ctrl+Shift+R**.

---
## Uji akhir
1. Buka situs → Beranda menampilkan kartu golongan darah (artinya frontend terhubung ke backend).
2. Login `superadmin` / `superadmin123` (**segera ganti password** di Pengaturan Pengguna).
3. F12 → Console: tidak boleh ada error merah.

## Masalah umum
| Gejala | Solusi |
|---|---|
| Situs 404 | `index.html` tidak di root repo. Ulangi dari folder `sim-donor-darah` (langkah 4–5). |
| Tampil tanpa warna / CSS 404 | Folder `css` dan `js` tidak ikut. Jangan upload lewat web GitHub; pakai langkah terminal. |
| Toast "GAS_URL belum diisi" | Isi `js/config.js`, lalu `git add .` → `commit` → `push`. |
| "Gagal menghubungi server" | URL `/exec` salah, atau Web App belum *Who has access: Anyone*. Uji URL di browser (langkah A8). |
| Perubahan backend tidak terasa | Deploy → New version (langkah A6). |
| `Password authentication is not supported` | Pakai Personal Access Token sebagai password. |
| `remote origin already exists` | Lewati, lanjut `git push`. |
| Muncul `LF will be replaced by CRLF` | Abaikan, hanya peringatan. |

**Istilah:** *repository* = folder proyek di GitHub · *commit* = simpan perubahan bercatatan · *push* = kirim ke GitHub · *token* = password khusus untuk terminal.
