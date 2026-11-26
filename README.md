# Smart Split Bill

Aplikasi web full-stack untuk membagi tagihan makan atau patungan secara **adil dan proporsional** — menghitung item pribadi, item sharing (`1/n`), pajak, service charge, serta diskon sesuai rasio pesanan tiap peserta.

## Fitur Utama

- **Dashboard Ringkasan (`/`)**: Menampilkan total tagihan, total nominal keseluruhan, jumlah tagihan yang belum lunas semua, pencarian judul tagihan, progress bar pelunasan, dan hapus tagihan dengan modal konfirmasi.
- **Buat Tagihan + Live Preview (`/create`)**: Form 3 langkah (Info Tagihan dengan preset Pajak `0%/10%/11%` & Service `0%/5%`, Peserta Patungan, dan Daftar Item dinamis dengan tombol cepat *Pilih Semua*) disertai panel *Live Preview* real-time yang menghitung estimasi bayar per orang secara otomatis.
- **Detail Tagihan (`/bills/:id`)**: Rincian lengkap per peserta (item pribadi/sharing, porsi pajak, service, diskon), toggle status **Lunas / Belum Lunas** langsung ke database, accordion **Cara Perhitungan Proporsional**, serta tombol **Salin ke WhatsApp** sekali klik.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React Router DOM, Lucide React
- **Backend**: Node.js (ES Modules), Express.js 5, `mysql2/promise`, `cors`, `dotenv`
- **Database**: MySQL 8+

## Struktur Folder

```text
.
├── backend/
│   ├── config/db.js                  # Koneksi MySQL pool (decimalNumbers: true)
│   ├── controllers/billController.js # Handler CRUD & validasi input
│   ├── database/schema.sql           # Skema 4 tabel relasional (ON DELETE CASCADE)
│   ├── routes/billRoutes.js          # Definisi endpoint /api/*
│   ├── utils/calculateSplit.js       # Logika kalkulasi proporsional
│   ├── .env.example
│   └── index.js                      # Entry point Express + 404 & global error handler
├── frontend/
│   ├── src/
│   │   ├── api/billApi.js            # Wrapper fetch ke REST API backend
│   │   ├── components/               # Navbar, BillCard, LiveSummaryCard, ParticipantBreakdownCard, ConfirmModal, Toast
│   │   ├── pages/                    # Dashboard, CreateBill, BillDetail
│   │   ├── utils/                    # formatCurrency, calculateSplit, whatsappFormat
│   │   ├── App.jsx                   # Routing & state Toast global
│   │   └── index.css                 # Tailwind v4 & base accessibility styles
│   └── .env.example
└── README.md
```

## Rumus Perhitungan Proporsional

1. **Subtotal Item**: `itemTotal = price * quantity`, lalu dibagi rata ke jumlah peserta yang ikut item tersebut (`shareAmount = itemTotal / shareCount`).
2. **Rasio Peserta**: `ratio = totalSubtotal > 0 ? person.subtotal / totalSubtotal : 0`.
3. **Pajak, Service, dan Diskon**:
   - `taxShare = totalTax * ratio`
   - `serviceShare = totalService * ratio`
   - `discountShare = discountAmount * ratio`
4. **Total Bayar Akhir**: `Math.round(Math.max(0, subtotal + taxShare + serviceShare - discountShare))` — aman dari `NaN` dan tidak pernah bernilai negatif.

## Skema Database (`smart_split_bill`)

Terdiri dari 4 tabel relasional dengan `ON DELETE CASCADE`:
- `bills` (`id`, `title`, `tax_percent`, `service_percent`, `discount_amount`, `created_at`)
- `participants` (`id`, `bill_id`, `name`, `is_paid`)
- `items` (`id`, `bill_id`, `name`, `price`, `quantity`)
- `item_shares` (`id`, `item_id`, `participant_id`)

## REST API Endpoints

Base URL default: `http://localhost:5000/api`

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/health` | Cek status server Express dan koneksi MySQL (`SELECT 1`) |
| `GET` | `/bills` | Ambil seluruh daftar tagihan urut terbaru beserta ringkasan & status lunas |
| `POST` | `/bills` | Buat tagihan baru lengkap dengan peserta, item, dan share (MySQL Transaction) |
| `GET` | `/bills/:id` | Ambil detail tagihan beserta kalkulasi proporsional tiap peserta |
| `PATCH` | `/participants/:id/status` | Perbarui status `is_paid` (`true` / `false`) peserta |
| `DELETE` | `/bills/:id` | Hapus tagihan beserta seluruh relasinya (`ON DELETE CASCADE`) |

## Cara Menjalankan Secara Lokal

### Prasyarat
- Node.js v18+ (disarankan v20/v22+)
- MySQL Server aktif di `localhost:3306`

### 1. Setup Database
Import skema SQL ke MySQL:
```bash
mysql -u root < backend/database/schema.sql
```
*(Atau jalankan isi file `backend/database/schema.sql` melalui phpMyAdmin / HeidiSQL / Laragon.)*

### 2. Konfigurasi & Jalankan Backend
```bash
cd backend
npm install
cp .env.example .env
```
Sesuaikan kredensial di `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=smart_split_bill
```
Jalankan server backend:
```bash
npm run dev
```
Server berjalan di `http://localhost:5000`. Verifikasi cepat: buka `http://localhost:5000/api/health`.

### 3. Konfigurasi & Jalankan Frontend
Buka terminal baru:
```bash
cd frontend
npm install
cp .env.example .env
```
Pastikan `frontend/.env` mengarah ke backend:
```env
VITE_API_URL=http://localhost:5000/api
```
Jalankan frontend:
```bash
npm run dev
```
Buka aplikasi di browser: `http://localhost:5173`.

## Script Tersedia

- **Backend (`backend/`)**: `npm run dev` (`node --watch index.js`), `npm start` (`node index.js`)
- **Frontend (`frontend/`)**: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
