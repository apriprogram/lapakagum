import { Phone, UsersRound } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import AdminDataTable from '@/components/AdminDataTable';
import {
  CustomerCreateModal, CustomerProfile, CustomerRowActions, type CustomerRecord,
} from '@/components/CustomerCrudModals';

export const dynamic = 'force-dynamic';

export default async function CustomerCategoriesPage() {
  const customers = await prisma.vendor.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-medium text-blue-600">Kategori</p>
        <h1 className="mt-1 text-2xl font-semibold text-blue-950">Kategori Pelanggan</h1>
        <p className="mt-2 text-sm text-slate-500">Kelola identitas, foto profil, dan status pelanggan dalam satu halaman.</p>
      </div>
      <CustomerCreateModal />
    </div>

    <section className="surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UsersRound className="size-4" /></span>
        <div><h2 className="text-sm font-semibold text-blue-950">Daftar pelanggan</h2><p className="mt-1 text-[11px] text-slate-400">{customers.length} pelanggan tersimpan</p></div>
      </div>
      <AdminDataTable title="Daftar pelanggan">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-5 py-3">Profil pelanggan</th>
              <th className="px-5 py-3">WhatsApp</th>
              <th className="px-5 py-3">Alamat</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Diperbarui</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {customers.map((customer) => {
              const record: CustomerRecord = {
                id: customer.id,
                name: customer.name,
                imageUrl: customer.imageUrl || '',
                phone: customer.phone || '',
                address: customer.address || '',
                notes: customer.notes || '',
                isActive: customer.isActive,
                createdAt: customer.createdAt.toISOString(),
                updatedAt: customer.updatedAt.toISOString(),
                transactionCount: 0,
              };
              return <tr key={customer.id} data-table-row className="hover:bg-blue-50/30">
                <td data-row-number className="px-4 py-4" />
                <td className="px-5 py-4"><CustomerProfile customer={record} /></td>
                <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-xs text-slate-600"><Phone className="size-3.5 text-blue-500" />{customer.phone || '-'}</span></td>
                <td className="max-w-[280px] px-5 py-4 text-xs leading-5 text-slate-600">{customer.address || '-'}</td>
                <td className="px-5 py-4"><span className={customer.isActive ? 'customer-status is-active' : 'customer-status is-inactive'}>{customer.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                <td className="px-5 py-4 text-xs text-slate-500">{customer.updatedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="px-5 py-4"><CustomerRowActions customer={record} /></td>
              </tr>;
            })}
            {!customers.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Belum ada pelanggan. Tambahkan pelanggan pertama Anda.</td></tr>}
          </tbody>
        </table>
      </AdminDataTable>
    </section>
  </div>;
}
