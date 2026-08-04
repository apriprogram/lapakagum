import { prisma } from '@/lib/prisma';
import { Tags } from 'lucide-react';
import AdminDataTable from '@/components/AdminDataTable';
import { AddCashCategoryModal, CashCategoryRowActions } from '@/components/CashCategoryModals';

export const dynamic = 'force-dynamic';

export default async function CashCategoriesPage() {
  const categories = await prisma.cashCategory.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] });

  const masuk = categories.filter(c => c.type === 'MASUK');
  const keluar = categories.filter(c => c.type === 'KELUAR');

  const Section = ({ title, items, color, defaultType }: { 
    title: string; 
    items: typeof categories; 
    color: string;
    defaultType: 'MASUK' | 'KELUAR';
  }) => (
    <section className="surface overflow-hidden">
      <div className={`flex items-center gap-3 border-b border-blue-100 px-5 py-4`}>
        <span className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
          <Tags className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-blue-950">{title}</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">{items.length} kategori</p>
        </div>
        <div className="ml-auto">
          <AddCashCategoryModal defaultType={defaultType} />
        </div>
      </div>
      <AdminDataTable title={title}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3 w-10">No.</th>
              <th className="px-5 py-3">Nama Kategori</th>
              <th className="px-5 py-3">Jenis Transaksi</th>
              <th className="px-5 py-3 text-right w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {items.map((cat, i) => (
              <tr key={cat.id} className="hover:bg-blue-50/30">
                <td className="px-5 py-3 text-slate-500 text-xs">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-blue-950">{cat.name}</td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${cat.type === 'MASUK' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {cat.type === 'MASUK' ? 'Kas Masuk' : 'Kas Keluar'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <CashCategoryRowActions category={{ id: cat.id, name: cat.name, type: cat.type as 'MASUK' | 'KELUAR' }} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">Belum ada kategori.</td></tr>
            )}
          </tbody>
        </table>
      </AdminDataTable>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Keuangan</p>
          <h1 className="mt-1 text-2xl font-semibold text-blue-950">Kategori Kas</h1>
          <p className="mt-2 text-sm text-slate-500">
            Kelola kategori untuk transaksi kas masuk dan kas keluar.
          </p>
        </div>
        <AddCashCategoryModal />
      </div>

      <Section title="Kategori Pemasukan" items={masuk} color="bg-emerald-50 text-emerald-600" defaultType="MASUK" />
      <Section title="Kategori Pengeluaran" items={keluar} color="bg-rose-50 text-rose-600" defaultType="KELUAR" />
    </div>
  );
}
