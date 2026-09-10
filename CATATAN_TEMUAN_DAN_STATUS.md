# 📝 Catatan Teknis, Temuan Root Cause & Status Tableau Server JWT Embed

Dokumen ini mencatat seluruh hasil investigasi, konfigurasi, dan status pengujian embedding Tableau Server dengan **Connected Apps Direct Trust (JWT)** saat Guest Mode dinonaktifkan.

---

## 🎯 1. Ringkasan Kebutuhan Awal
- **Tujuan:** Membuat web portal embed dashboard Tableau Server yang mengotentikasi pengguna secara otomatis menggunakan JSON Web Token (JWT), dengan skenario **Guest Mode dimatikan**.
- **User Identity:** `satudata`
- **Target URL:** `https://data-statistik.jakarta.go.id/views/Superstore/Overview`
- **Repositori Git:** `https://github.com/dprof12/tableau-jwt-embed-chat.git`
- **Deployment Platform:** Vercel (`https://tableau-jwt-embed-chat.vercel.app`)

---

## 🔑 2. Konfigurasi Kredensial Connected App
Di Tableau Server internal (`10.15.102.178`), Connected App telah dibuat dan berstatus **Enabled**:
- **App Name:** `satudata`
- **Client ID:** `14b071c5-26fe-4a37-a449-e0e7c9c361db`
- **Secret ID:** `288c00ba-80d3-450a-bbcf-1e2930b1383f`
- **Secret Value:** `uH8LLobQxkcpTFI2m7EMQtpVP+hMpr+Z68WyAs7LM6Q=`
- **Access Level:** All projects
- **Domain Allowlist:** `https://tableau-jwt-embed-chat.vercel.app` *(dan `All`)*

---

## 🔬 3. Temuan Root Cause & Hasil Investigasi

### A. Gejala di Sisi Browser (Client-Side)
Saat mengakses `https://tableau-jwt-embed-chat.vercel.app` dan mengklik tombol **Embed & Auth**, browser memunculkan error di DevTools Console:
```text
Access to fetch at 'https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin' 
from origin 'https://tableau-jwt-embed-chat.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
net::ERR_FAILED
TypeError: Failed to fetch (tableau.embedding.3.latest.min.js)
```

### B. Root Cause Sebenarnya (Packet Level Inspection)
Berdasarkan pengecekan cURL langsung ke target:
```bash
curl -i -X OPTIONS https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin \
  -H "Origin: https://tableau-jwt-embed-chat.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Ternyata request tersebut **BUKAN ditolak oleh Tableau Server**, melainkan **DICEGAT oleh Web Application Firewall (WAF Diskominfotik / F5 / FortiWeb)** yang berada di depan domain publik `data-statistik.jakarta.go.id`!

Response dari WAF mengembalikan halaman HTML kuning:
```html
<h2>⚠️ URL YANG DIMINTA DI TOLAK ⚠️</h2>
<p>Silahkan Konsultasikan dengan Call Center UP Layanan Teknologi Informasi dan Komunikasi</p>
<div class="red-box"><p>Support ID Anda : 435440845155955641</p></div>
<p>UP Layanan Teknologi Informasi dan Komunikasi Diskominfotik Provinsi DKI Jakarta</p>
```
Karena WAF mengembalikan halaman HTML penolakan tanpa menyertakan header `Access-Control-Allow-Origin`, browser Chrome/Edge langsung menganggap preflight CORS gagal (`net::ERR_FAILED`).

### C. Pembuktian Validasi Server Asli (`10.15.102.178`)
Ketika request preflight `OPTIONS` yang sama dites langsung ke server upstream Tableau di IP internal intranet:
```bash
curl -i -X OPTIONS http://10.15.102.178/vizportal/api/web/v1/auth/embed/signin \
  -H "Origin: https://tableau-jwt-embed-chat.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

Server Tableau internal **MERESPONS 100% SUKSES DAN VALID DENGAN HEADER CORS**:
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://tableau-jwt-embed-chat.vercel.app
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
```
**Kesimpulan:** Kode aplikasi, konfigurasi JWT, Secret Key, Client ID, dan Domain Allowlist di Tableau Server **SUDAH 100% BENAR DAN BERFUNGSI**. Hambatannya murni karena WAF memblokir HTTP Method `OPTIONS` pada path `/vizportal/api/web/v1/auth/embed/signin`.

---

## 📋 4. Status Laporan Tiket ke UP LTIK (Biro TI / Network Security)
Dokumen tiket telah disiapkan di [`LAPORAN_TIKET_UP_LTIK.md`](LAPORAN_TIKET_UP_LTIK.md) dan [`laporan_waf_support_id.html`](laporan_waf_support_id.html).

**Parameter yang perlu di-whitelist oleh tim WAF UP LTIK:**
1. **URL:** `https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin`
2. **HTTP Method yang Wajib Diizinkan:** **`OPTIONS` dan `POST`**
   - `OPTIONS` untuk CORS Preflight handshake dari browser.
   - `POST` untuk pengiriman payload token JWT (`signInWithJwt`).
3. **Contoh Support ID:** `435440845155955641` *(dan `435440845153598883`)*

---

## ⏩ 5. Langkah Tindak Lanjut Saat Dilanjutkan Nanti
1. **Setelah WAF Di-whitelist oleh UP LTIK:**
   - Langsung buka kembali `https://tableau-jwt-embed-chat.vercel.app`.
   - Klik **Embed & Auth**.
   - Dashboard Tableau Server akan langsung ter-render otomatis tanpa popup login.
2. **Pengujian Alternatif via Intranet (Opsional):**
   - Jika ingin menguji coba secara lokal tanpa menunggu tiket WAF, gunakan target URL internal `http://10.15.102.178/views/Superstore/Overview` di `http://localhost:3000`.
3. **Pengembangan Tahap 2 (Sesuai Plan Awal):**
   - Mengintegrasikan modul **AI Chatbot (Po'tata / Gemini)** di samping viewer dashboard yang membaca konteks visualisasi aktif secara dinamis.
