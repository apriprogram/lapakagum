const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const cats = [
  { name: 'Penjualan stok', type: 'MASUK' },
  { name: 'Uang masuk lain', type: 'MASUK' },
  { name: 'Setoran modal', type: 'MASUK' },
  { name: 'Pembelian stok', type: 'KELUAR' },
  { name: 'Operasional', type: 'KELUAR' },
  { name: 'Listrik dan air', type: 'KELUAR' },
  { name: 'Gaji karyawan', type: 'KELUAR' },
  { name: 'Transport', type: 'KELUAR' },
  { name: 'Pengeluaran lain', type: 'KELUAR' },
];

p.cashCategory.createMany({ data: cats, skipDuplicates: true })
  .then(r => console.log('Seeded:', r.count, 'categories'))
  .catch(console.error)
  .finally(() => p.$disconnect());
