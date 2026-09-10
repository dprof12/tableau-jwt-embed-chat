# 📋 Laporan Tiket Kendala WAF Tableau Server (CORS OPTIONS Preflight)

**Kepada:** UP Layanan Teknologi Informasi dan Komunikasi (UP LTIK) / Tim Keamanan Jaringan & WAF Diskominfotik DKI Jakarta  
**Dari:** Dava (Diskominfotik DKI Jakarta)  
**Perihal:** Permohonan Whitelist HTTP Method `OPTIONS` (CORS Preflight) untuk Endpoint Autentikasi Tableau Server Embedding JWT  

---

### 1. Ringkasan Kendala
Saat mengintegrasikan dashboard Tableau Server (`data-statistik.jakarta.go.id`) ke portal web resmi menggunakan mekanisme **Tableau Connected Apps (JWT Authentication)**, request browser otomatis mengirimkan preflight CORS (`OPTIONS`).

Request tersebut diblokir oleh WAF (Web Application Firewall) Diskominfotik dan menghasilkan halaman penolakan dengan **Support ID**.

---

### 2. Bukti & Parameter Support ID WAF
- **Support ID Terbaru:** `435440845153598883` *(Support ID sebelumnya: `435440845188049240`)*
- **URL Endpoint yang Terdampak:**  
  `https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin`
- **HTTP Method yang Diblokir:** `OPTIONS` *(CORS Preflight Check)*
- **Origin Pemanggil:** `https://tableau-jwt-embed-chat.vercel.app` *(dan domain portal Pemprov terkait)*

---

### 3. Request Header yang Dikirim Browser (cURL Reproduce)
```bash
curl -i -X OPTIONS https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin \
  -H "Origin: https://tableau-jwt-embed-chat.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

**Response yang Diterima dari WAF (Saat Ini Diblokir):**
```html
<h2>⚠️ URL YANG DIMINTA DI TOLAK ⚠️</h2>
<p>Silahkan Konsultasikan dengan Call Center UP Layanan Teknologi Informasi dan Komunikasi</p>
<div class="red-box"><p>Support ID Anda : 435440845153598883</p></div>
```

---

### 4. Dampak Fungsional
Web browser client (Chrome, Edge, Safari) gagal menyelesaikan proses *handshake* token JWT Tableau karena request preflight `OPTIONS` ditolak sebelum mencapai backend Tableau Server. Akibatnya, dashboard tidak dapat di-embed (*net::ERR_FAILED*).

---

### 5. Rekomendasi Solusi / Permohonan ke Tim WAF UP LTIK
Mohon bantuan tim WAF / Network Security UP LTIK untuk:
1. **Mengizinkan (Whitelist) HTTP Method `OPTIONS`** khusus untuk path:
   `/vizportal/api/web/v1/auth/embed/signin` pada domain `data-statistik.jakarta.go.id`.
2. Meneruskan request `OPTIONS` tersebut ke upstream Tableau Server (`10.15.102.178`) agar Tableau Server dapat merespons dengan header CORS yang valid (`Access-Control-Allow-Origin` & `Access-Control-Allow-Credentials: true`).

Terima kasih atas bantuannya.
