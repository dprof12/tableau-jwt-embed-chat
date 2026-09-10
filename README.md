# Tableau Server JWT Embed Portal 📊🔐

Web portal modern untuk embedding dashboard **Tableau Server menggunakan autentikasi Connected Apps (Direct Trust JWT)** dengan skenario **Guest Mode dinonaktifkan (Guest OFF)**.

---

## 🌟 Fitur Utama
- **Connected Apps Direct Trust JWT**: Men-generate token JWT berstandar resmi Tableau Server dengan spesifikasi header (`kid`, `iss`, `HS256`) dan payload (`sub`, `aud`, `scp`, `jti`, `exp`).
- **Tableau Embedding API v3 (`<tableau-viz>`)**: Me-render frame visualisasi resmi yang mengelola otentikasi token di balik layar secara aman.
- **Dynamic View Switcher**: Dapat mengganti link dashboard Tableau secara instan di UI tanpa perlu build ulang kode.
- **Token Diagnostics & Countdown**: Melihat rincian header/payload JWT decoded dan memantau masa aktif token secara real-time.
- **Vercel Serverless Ready**: Struktur API endpoint siap dideploy ke Vercel (HTTPS otomatis untuk menjamin izin third-party cookies).

---

## 📁 Struktur Direktori
```
tableau-jwt-embed-chat/
├── api/
│   ├── tableau-token.js      # Serverless API Handler (JWT Token Generator)
│   └── config.js             # Public Server Config Handler
├── public/
│   ├── index.html            # Halaman Web Portal Embed
│   ├── css/
│   │   └── style.css         # Modern Dark Glassmorphic Styling
│   └── js/
│       └── app.js            # Controller frontend (request token & mount viz)
├── test/
│   └── test-token.js         # Offline JWT validation test script
├── .env.example              # Template Environment Variables
├── vercel.json               # Konfigurasi routing & CORS Vercel
├── server.js                 # Local Express server
└── package.json              # Dependensi
```

---

## 🚀 Panduan Deploy ke Vercel (HTTPS)

1. **Import Project di Vercel**:
   - Buka [vercel.com](https://vercel.com) dan buat project baru dari repository `https://github.com/dprof12/tableau-jwt-embed-chat`.
2. **Tambahkan Environment Variables**:
   Masuk ke **Settings** > **Environment Variables** di Vercel, lalu tambahkan:
   - `TABLEAU_SERVER_URL`: `https://data-statistik.jakarta.go.id`
   - `TABLEAU_CLIENT_ID`: (Client ID dari Connected App)
   - `TABLEAU_SECRET_ID`: (Secret ID dari Connected App)
   - `TABLEAU_SECRET_VALUE`: (Secret Value dari Connected App)
   - `TABLEAU_USERNAME`: `satudata`
   - `TABLEAU_DEFAULT_VIEW_URL`: `https://data-statistik.jakarta.go.id/views/Superstore/Overview`
3. **Klik Deploy**:
   - Vercel akan menghasilkan domain HTTPS (misal: `https://tableau-jwt-embed-chat.vercel.app`).
   - Buka URL tersebut, dashboard Tableau akan langsung terotentikasi via JWT tanpa blokir cookie!
