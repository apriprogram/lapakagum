import { Phone, UsersRound } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import AdminDataTable from '@/components/AdminDataTable';
import {
  ResellerCreateModal, ResellerProfile, ResellerRowActions, type ResellerRecord,
} from '@/components/ResellerCrudModals';

export const dynamic = 'force-dynamic';

export default async function ResellerCategoriesPage() {
  const resellers = await prisma.reseller.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-medium text-blue-600">Kategori</p>
        <h1 className="mt-1 text-2xl font-semibold text-blue-950">Kategori Penjual</h1>
        <p className="mt-2 text-sm text-slate-500">Kelola identitas, foto profil, dan status penjual dalam satu halaman.</p>
      </div>
      <ResellerCreateModal />
    </div>

    <section className="surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UsersRound className="size-4" /></span>
        <div><h2 className="text-sm font-semibold text-blue-950">Daftar penjual</h2><p className="mt-1 text-[11px] text-slate-400">{resellers.length} penjual tersimpan</p></div>
      </div>
      <AdminDataTable title="Daftar penjual">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-5 py-3">Profil penjual</th>
              <th className="px-5 py-3">WhatsApp</th>
              <th className="px-5 py-3">Alamat</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Diperbarui</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {resellers.map((reseller) => {
              const record: ResellerRecord = {
                id: reseller.id,
                name: reseller.name,
                imageUrl: reseller.imageUrl || '',
                phone: reseller.phone || '',
                address: reseller.address || '',
                notes: reseller.notes || '',
                isActive: reseller.isActive,
                createdAt: reseller.createdAt.toISOString(),
                updatedAt: reseller.updatedAt.toISOString(),
                transactionCount: 0,
              };
              return <tr key={reseller.id} data-table-row className="hover:bg-blue-50/30">
                <td data-row-number className="px-4 py-4" />
                <td className="px-5 py-4"><ResellerProfile reseller={record} /></td>
                <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-xs text-slate-600"><Phone className="size-3.5 text-blue-500" />{reseller.phone || '-'}</span></td>
                <td className="max-w-[280px] px-5 py-4 text-xs leading-5 text-slate-600">{reseller.address || '-'}</td>
                <td className="px-5 py-4"><span className={reseller.isActive ? 'customer-status is-active' : 'customer-status is-inactive'}>{reseller.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                <td className="px-5 py-4 text-xs text-slate-500">{reseller.updatedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="px-5 py-4"><ResellerRowActions reseller={record} /></td>
              </tr>;
            })}
            {!resellers.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Belum ada penjual. Tambahkan penjual pertama Anda atau biarkan sistem mencatatnya otomatis.</td></tr>}
          </tbody>
        </table>
      </AdminDataTable>
    </section>
  </div>;
}
