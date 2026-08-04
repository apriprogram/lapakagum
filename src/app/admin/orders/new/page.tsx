import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SalesInventoryForm } from '@/components/InventoryTransactionForm';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const [products, categoriesDb] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, stock: { gt: 0 } }, orderBy: { name: 'asc' } }),
    prisma.productCategory.findMany({ orderBy: { name: 'asc' } })
  ]);
  const categories = categoriesDb.map(c => c.name);

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><Link href="/admin/orders" className="interactive flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-white"><ArrowLeft className="size-4" /></Link><div><p className="text-sm font-medium text-blue-600">Operasional</p><h1 className="text-2xl font-semibold text-blue-950">Tambah Penjualan</h1><p className="mt-1 text-xs text-slate-500">Pilih barang dan masukkan jumlah yang terjual.</p></div></div>
    <SalesInventoryForm categories={categories} products={products.map((item) => ({ id: item.id, name: item.name, category: item.category, imageUrl: item.imageUrl, unit: item.unit, stock: Number(item.stock), buyPrice: Number(item.buyPrice), price: Number(item.price) }))} />
  </div>;
}
