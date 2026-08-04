import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createProduct } from '@/app/actions/product';
import ProductForm from '@/components/ProductForm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewStockPage() {
  const categoriesDb = await prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
  const categories = categoriesDb.map(c => ({ value: c.slug, label: c.name }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/stock" className="interactive flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-white">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-sm font-medium text-blue-600">Persediaan</p>
          <h1 className="text-2xl font-semibold text-blue-950">Tambah barang</h1>
          <p className="mt-1 text-xs text-slate-500">Tetapkan identitas, foto, dan patokan harga barang.</p>
        </div>
      </div>
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
