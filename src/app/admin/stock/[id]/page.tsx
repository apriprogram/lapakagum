import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { updateProduct } from '@/app/actions/product';
import ProductForm from '@/components/ProductForm';

export default async function EditStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

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
          <h1 className="text-2xl font-semibold text-blue-950">Edit barang</h1>
          <p className="mt-1 text-xs text-slate-500">Perbarui foto, nama, kategori, dan patokan harga.</p>
        </div>
      </div>
      <ProductForm 
        action={updateProduct.bind(null, id)} 
        categories={categories}
        product={{ name: product.name, category: product.category, buyPrice: Number(product.buyPrice), price: Number(product.price), unit: product.unit, imageUrl: product.imageUrl }} 
      />
    </div>
  );
}
