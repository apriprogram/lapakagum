import { Tag } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import AdminDataTable from '@/components/AdminDataTable';
import { CategoryCreateModal, CategoryRowActions } from '@/components/CategoryCrudModals';

export const dynamic = 'force-dynamic';

export default async function ProductCategoriesPage() {
  const categories = await prisma.productCategory.findMany({
    orderBy: { name: 'asc' },
  });

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await prisma.product.count({ where: { category: cat.slug } });
      return { ...cat, productCount: count };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Kategori</p>
          <h1 className="mt-1 text-2xl font-semibold text-blue-950">Kategori Barang</h1>
          <p className="mt-2 text-sm text-slate-500">Kelola daftar kategori untuk barang dagangan Anda.</p>
        </div>
        <CategoryCreateModal />
      </div>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Tag className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-blue-950">Daftar kategori</h2>
            <p className="mt-1 text-[11px] text-slate-400">Semua kategori barang</p>
          </div>
        </div>

        <AdminDataTable title="Daftar kategori">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3 w-16">No.</th>
                <th className="px-5 py-3">Nama Kategori</th>
                <th className="px-5 py-3 text-center">Jumlah Barang</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {categoriesWithCount.map((category, index) => (
                <tr key={category.id} className="hover:bg-blue-50/30">
                  <td className="px-5 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-4 font-medium text-blue-950">{category.name}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {category.productCount} barang
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <CategoryRowActions category={category} />
                  </td>
                </tr>
              ))}
              {!categoriesWithCount.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                    Belum ada kategori barang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminDataTable>
      </section>
    </div>
  );
}
