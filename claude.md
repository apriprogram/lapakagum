# Peta Sistem Website: Lapak Udang & Ikan (lapak_udang_ikan)

Dokumen ini memetakan arsitektur, struktur direktori, dan skema database dari sistem **Lapak Udang & Ikan** untuk memudahkan pemahaman dan pengembangan lebih lanjut.

## 1. Tech Stack Utama
- **Framework**: Next.js (App Router) dengan TypeScript.
- **Database ORM**: Prisma.
- **Database Engine**: MySQL.
- **Styling**: Tailwind CSS v4 (menggunakan `@tailwindcss/postcss`).
- **Authentication**: Next-Auth v4 (terlihat dari dependensi `next-auth` di package.json).

## 2. Struktur Direktori

### `/src` - Kode Sumber Utama
- **`/app`** (Next.js App Router):
  - `/` (root): Berisi `page.tsx` untuk halaman depan/storefront.
  - `/admin`: Halaman dashboard dan modul manajemen admin.
    - Modul meliputi: `dashboard`, `products`, `product-categories`, `vendors`, `purchases`, `debts`, `stock`, `resellers`, `orders`, `finance`, `cash-categories`, `reports`, dan `profile`.
  - `/login`: Halaman autentikasi/login.
  - `/register`: Halaman pendaftaran pelanggan baru.
  - `/api`: Rute API endpoint, contohnya `/api/upload` untuk unggah file/gambar.
  - `/actions`: Next.js Server Actions untuk memproses mutasi data database (CRUD logic).
  - `/fonts`: Font lokal yang digunakan dalam aplikasi.
- **`/components`** (Komponen UI):
  - **Admin & Dashboard**: `AdminShell.tsx`, `AdminDataTable.tsx`, `DashboardStatisticCards.tsx`, `FinanceStatisticCards.tsx`, `FinanceChart.tsx`.
  - **Form & CRUD Modals**: Berbagai modal CRUD spesifik entitas (`CategoryCrudModals.tsx`, `CashCategoryModals.tsx`, `OrderCrudModals.tsx`, `PurchaseCrudModals.tsx`, `ResellerCrudModals.tsx`), form input (`ProductForm.tsx`, `PurchaseForm.tsx`, `InventoryTransactionForm.tsx`), dan `ConfirmDialog.tsx`.
  - **Input & UI Controls**: `AppCombobox.tsx`, `AppSelect.tsx`, `AdminDatePicker.tsx`, `AdminMonthPicker.tsx`, `CurrencyInput.tsx`, `ImageUpload.tsx`.
  - **Tampilan Pelanggan**: `Storefront.tsx`, `UserMenu.tsx`, `ProfileForm.tsx`.
  - **Utility & Providers**: `ToastProvider.tsx`, `Providers.tsx`, `SessionSecurity.tsx`, `PrintButton.tsx`, `AdminThemeToggle.tsx`.
- **`/lib`** (Utilitas dan Helper):
  - Konfigurasi: `prisma.ts` (koneksi database), `auth.ts` (autentikasi).
  - Pembantu Bisnis: `dashboard-statistics.ts`, `format.ts`, `order-number.ts`.
  - Keamanan/Validasi: `login-rate-limit.ts`, `validation.ts`.
- **`/types`**: Definisi antarmuka (interface) dan tipe (types) TypeScript secara global.

### Root Files Lainnya
- **`/prisma`**: Berisi `schema.prisma` yang mendefinisikan model tabel database, serta script seeding data (`seed-*.js`).
- **`/public`**: Aset publik statis (gambar, favicon, dll).
- **`/scripts`**: Skrip utilitas tambahan, bersama dengan skrip operasional di root.
- **Konfigurasi Tambahan**: `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`.

## 3. Peta Database (Berdasarkan `schema.prisma`)

Sistem database mencakup ERP/POS yang mendukung multi-role, akuntansi dasar, manajemen inventaris batch, serta pencatatan utang.

1. **Pengguna & Autentikasi**
   - **`User`**: Data pengguna (id, name, email, password, role: `ADMIN` atau `CUSTOMER`).

2. **Produk & Inventori**
   - **`Product`**: Detail produk (nama, kategori, gambar, satuan, harga beli, harga jual, stok saat ini).
   - **`ProductCategory`**: Data kategori produk (nama, slug).
   - **`StockBatch`**: Manajemen batch stok (mencatat batch barang masuk untuk manajemen umur simpan, HPP akurat, dan status batch).
   - **`StockMovement`**: Log pergerakan barang secara detail (pembelian, penjualan, retur, susut, penyesuaian masuk/keluar, carry over).

3. **Vendor & Pembelian (Restocking) & Utang**
   - **`Vendor`**: Data pemasok/supplier.
   - **`Purchase`** & **`PurchaseItem`**: Nota dan detail pembelian barang dari vendor, mendukung status kepemilikan (beli putus, konsinyasi).
   - **`VendorPayment`**: Pencatatan pembayaran tagihan (invoice) ke vendor.
   - **`StandaloneDebt`** & **`StandaloneDebtPayment`**: Pencatatan dan pencicilan utang vendor di luar nota pembelian langsung (saldo awal utang atau utang lainnya).

4. **Pelanggan & Penjualan**
   - **`Reseller`**: Data pelanggan/reseller (nama, kontak, alamat, status aktif).
   - **`Order`** & **`OrderItem`**: Transaksi penjualan/pesanan pelanggan, melacak total bayar, HPP, profit kotor, dan status pesanan.

5. **Keuangan & Laporan**
   - **`CashCategory`**: Kategori untuk mengelompokkan transaksi kas (Masuk/Keluar).
   - **`CashTransaction`**: Arus kas operasional (uang masuk/keluar di luar penjualan/pembelian langsung).
   - **`CapitalTransaction`**: Mutasi modal usaha (setoran modal, tambahan, penarikan/prive).
   - **`DailyClosing`**: Tutup buku harian (akumulasi pembelian, penjualan, HPP, pengeluaran, profit harian, dan sisa stok).
   - **`AuditLog`**: Pencatatan log aktivitas dan perubahan dalam sistem.

## 4. Alur Bisnis Utama
1. **Pemesanan Pelanggan**: Pelanggan dapat melihat produk melalui `Storefront`, lalu melakukan pemesanan (`Order`).
2. **Manajemen Inventori & Batch**: Barang yang dibeli dari Vendor masuk sebagai `StockBatch` dengan HPP spesifik. Saat terjadi penjualan, sistem memotong stok berdasarkan batch terlama (FIFO) atau aturan tertentu dan mencatat `StockMovement`. Admin juga dapat melakukan penyesuaian stok manual.
3. **Manajemen Vendor & Utang**: Admin mencatat pembelian (`Purchase`) dari Vendor. Jika belum lunas, tercatat sebagai utang. Pembayaran utang difasilitasi melalui `VendorPayment` (untuk nota) atau `StandaloneDebtPayment` (untuk utang saldo berjalan).
4. **Arus Kas & Keuangan (Finance)**: Admin mencatat pendapatan lain-lain dan biaya operasional (`CashTransaction`), serta aliran modal (`CapitalTransaction`). Dashboard menyediakan visualisasi finansial (FinanceChart) dan rekapitulasi.
5. **Pembukuan Otomatis/Manual & Pelaporan**: Semua pergerakan terintegrasi. Admin dapat memonitor laporan laba/rugi harian melalui tutup buku (`DailyClosing`) dan memantau jejak audit dari berbagai aksi di sistem.
