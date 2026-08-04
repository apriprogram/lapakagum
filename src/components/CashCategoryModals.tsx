'use client';

import { useState } from 'react';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { createCashCategory, deleteCashCategory, updateCashCategory } from '@/app/actions/cashCategory';
import AdminActionForm from '@/components/AdminActionForm';
import AppSelect from '@/components/AppSelect';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';

const TYPE_OPTIONS = [
  { value: 'MASUK', label: 'Pemasukan (Kas Masuk)' },
  { value: 'KELUAR', label: 'Pengeluaran (Kas Keluar)' },
];

const inputCls = 'mt-1.5 h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500';

export function AddCashCategoryModal({ defaultType }: { defaultType?: 'MASUK' | 'KELUAR' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="admin-data-action inline-flex items-center gap-2">
        <Plus size={16} /> Tambah kategori
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Kategori Kas" icon={<Tag size={16} />}>
        <AdminActionForm action={createCashCategory} successMessage="Kategori berhasil ditambahkan." onSuccess={() => setOpen(false)} className="grid gap-5">
          <label className="block text-xs font-medium text-slate-600">
            Jenis Transaksi
            <AppSelect name="type" defaultValue={defaultType ?? 'MASUK'} className={inputCls} options={TYPE_OPTIONS} />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Nama Kategori
            <input name="name" required className={inputCls} placeholder="contoh: Listrik, Gaji, Uang masuk lain..." />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" className="admin-data-action rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Simpan</button>
          </div>
        </AdminActionForm>
      </Modal>
    </>
  );
}

export type CashCategoryRecord = { id: number; name: string; type: 'MASUK' | 'KELUAR' };

export function CashCategoryRowActions({ category }: { category: CashCategoryRecord }) {
  const [editOpen, setEditOpen] = useState(false);
  const { confirm, dialog } = useConfirm();
  const { showToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Hapus kategori kas?',
      message: `Kategori "${category.name}" akan dihapus permanen.`,
      confirmLabel: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCashCategory(category.id);
      showToast('Kategori berhasil dihapus.', 'success', 'Berhasil');
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus', 'error', 'Error');
    }
  };

  return (
    <div className="admin-row-actions">
      {dialog}
      <button type="button" onClick={() => setEditOpen(true)} aria-label="Edit kategori" title="Edit"><Pencil /></button>
      <button type="button" onClick={handleDelete} className="is-danger" aria-label="Hapus kategori" title="Hapus"><Trash2 /></button>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Kategori Kas" icon={<Tag size={16} />}>
        <AdminActionForm action={updateCashCategory.bind(null, category.id)} successMessage="Kategori berhasil diperbarui." onSuccess={() => setEditOpen(false)} className="grid gap-5">
          <label className="block text-xs font-medium text-slate-600">
            Jenis Transaksi
            <AppSelect name="type" defaultValue={category.type} className={inputCls} options={TYPE_OPTIONS} />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Nama Kategori
            <input name="name" required defaultValue={category.name} className={inputCls} />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" className="admin-data-action rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Simpan</button>
          </div>
        </AdminActionForm>
      </Modal>
    </div>
  );
}
