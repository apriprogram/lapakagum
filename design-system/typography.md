# Poppins Typography Design System

Sistem ini adalah sumber kebenaran tipografi untuk storefront, autentikasi, dan admin Lapak Udang & Ikan. Gunakan Poppins 400/500/600 yang sudah dibundel lokal. Hindari bobot sintetis dan ukuran arbitrer.

## Type scale

| Component | Font Size | Weight | Line Height | Letter Spacing | Usage |
|---|---:|---:|---:|---:|---|
| H1 | 32px | 600 | 40px | -0.64px (-0.02em) | Judul halaman utama atau judul autentikasi |
| H2 | 24px | 600 | 32px | -0.36px (-0.015em) | Judul seksi utama |
| H3 | 20px | 600 | 28px | -0.20px (-0.01em) | Judul panel atau subseksi |
| H4 | 18px | 600 | 26px | -0.09px (-0.005em) | Judul modal dan kelompok konten |
| H5 | 16px | 600 | 24px | 0 | Judul kartu besar |
| H6 | 14px | 600 | 20px | 0 | Judul kartu kompak |
| Body Large | 16px | 400 | 26px | 0 | Intro, deskripsi penting, dan konten pemasaran |
| Body Medium | 14px | 400 | 22px | 0 | Teks antarmuka dan isi standar |
| Body Small | 12px | 400 | 18px | 0 | Metadata pendukung dan deskripsi kompak |
| Caption | 11px | 400 | 16px | 0.06px (0.005em) | Keterangan singkat dan timestamp |
| Overline | 10px | 600 | 14px | 0.8px (0.08em) | Label kategori uppercase |

## Component typography

| Component | Font Size | Weight | Line Height | Letter Spacing | Usage |
|---|---:|---:|---:|---:|---|
| Table / Header Table | 10px | 600 | 14px | 0.6px (0.06em) | Header kolom uppercase |
| Table / Data Table | 12px | 400 | 18px | 0 | Isi sel tabel |
| Table / Secondary Text | 11px | 400 | 16px | 0 | ID, tanggal, dan detail sekunder |
| Table / Empty State | 13px | 400 | 20px | 0 | Pesan tabel kosong |
| Table / Pagination | 11px | 500 | 16px | 0 | Nomor halaman dan ringkasan |
| Form / Label | 12px | 500 | 18px | 0 | Label field |
| Form / Input Text | 14px | 400 | 22px | 0 | Nilai input, textarea, dan select |
| Form / Placeholder | 14px | 400 | 22px | 0 | Contoh nilai, gunakan warna muted |
| Form / Helper Text | 11px | 400 | 16px | 0 | Bantuan validasi |
| Form / Error Text | 11px | 500 | 16px | 0 | Pesan kesalahan |
| Form / Success Text | 11px | 500 | 16px | 0 | Pesan keberhasilan |
| Button / Large | 14px | 600 | 20px | 0.14px (0.01em) | CTA tinggi 44-48px |
| Button / Medium | 12px | 600 | 18px | 0.12px (0.01em) | Aksi standar tinggi 38-42px |
| Button / Small | 11px | 600 | 16px | 0.11px (0.01em) | Toolbar dan aksi kompak |
| Button / Icon Button | 12px | 500 | 18px | 0 | Tooltip atau accessible label; ikon 14-18px |
| Sidebar / App Name | 14px | 600 | 20px | -0.14px (-0.01em) | Nama aplikasi |
| Sidebar / Menu | 12px | 500 | 18px | 0 | Navigasi utama |
| Sidebar / Active Menu | 12px | 600 | 18px | 0 | Navigasi aktif |
| Sidebar / Submenu | 11px | 500 | 16px | 0 | Navigasi turunan |
| Sidebar / Section Title | 10px | 600 | 14px | 1px (0.10em) | Pengelompokan menu uppercase |
| Navbar / Page Title | 14px | 600 | 20px | -0.07px (-0.005em) | Konteks halaman aktif |
| Navbar / Breadcrumb | 11px | 500 | 16px | 0 | Jalur navigasi |
| Navbar / Username | 11px | 600 | 16px | 0 | Nama pengguna |
| Navbar / User Role | 10px | 400 | 14px | 0 | Peran pengguna |
| Card / Card Title | 14px | 600 | 20px | 0 | Judul kartu |
| Card / Card Description | 12px | 400 | 19px | 0 | Deskripsi kartu |
| Card / Statistic Value | 24px | 600 | 32px | -0.48px (-0.02em) | KPI utama |
| Card / Statistic Label | 11px | 500 | 16px | 0 | Label KPI |
| Modal / Modal Title | 18px | 600 | 26px | -0.09px (-0.005em) | Judul dialog |
| Modal / Modal Description | 13px | 400 | 20px | 0 | Penjelasan dialog |
| Modal / Footer Action | 12px | 600 | 18px | 0.12px (0.01em) | Tombol footer dialog |
| Badge & Chip / Badge | 10px | 600 | 14px | 0.2px (0.02em) | Penanda kategori |
| Badge & Chip / Status Badge | 10px | 500 | 14px | 0.1px (0.01em) | Status semantik |
| Badge & Chip / Chip | 11px | 500 | 16px | 0 | Filter atau pilihan |
| Notification / Toast Title | 13px | 600 | 20px | 0 | Judul toast |
| Notification / Toast Description | 11px | 400 | 17px | 0 | Detail toast |
| Notification / Alert Title | 13px | 600 | 20px | 0 | Judul alert |
| Notification / Alert Description | 12px | 400 | 19px | 0 | Isi alert |

## Design rules

- Base font size: 14px untuk dashboard; 16px untuk paragraf pemasaran atau konten panjang.
- Font scale: modular scale 1.125 dengan titik utama 10, 11, 12, 14, 16, 18, 20, 24, dan 32px.
- Vertical rhythm: gunakan grid 4px; line-height utama 14, 16, 18, 20, 22, 24, 26, 28, 32, dan 40px.
- Spacing: jarak label ke field 8px, judul ke deskripsi 4-8px, antar paragraf 12-16px, dan antar seksi 24-32px.
- Color hierarchy: primary #172033, secondary #6B7485, muted #98A1B2, link/active #246BFD, success #159455, warning #B87800, error #D24455.
- Responsive typography: H1 menjadi 28/36px di bawah 640px; H2 menjadi 22/30px. Body dan kontrol tidak dikecilkan.
- Accessibility: pertahankan kontras WCAG AA, minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar. Jangan gunakan warna sebagai satu-satunya indikator.
- Minimum: 12px untuk informasi yang harus dibaca atau dioperasikan. Ukuran 10-11px hanya untuk metadata singkat, badge, dan overline dengan kontras memadai.
- Batasi panjang paragraf menjadi 60-75 karakter dan hindari uppercase untuk kalimat panjang.
- Gunakan tabular numbers pada KPI, harga, tabel keuangan, dan pagination.
- Gunakan maksimal tiga tingkat hierarki tipografi dalam satu kartu.
- Gunakan bobot 600 untuk penekanan; jangan memakai 700 karena file font tidak dibundel.

## Production implementations

- CSS variables dan aturan semantik aktif: `src/app/globals.css`.
- Tailwind v4 reference: `design-system/tailwind-typography.css`.
- Generic design tokens: `design-system/typography.tokens.json`.
- Figma/Tokens Studio: `design-system/figma-typography.tokens.json`.
