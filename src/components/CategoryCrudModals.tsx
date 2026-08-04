'use client';

import { useState } from 'react';
import { Pencil, Save, Tag, Trash2 } from 'lucide-react';
import { createCategory, deleteCategory, updateCategory } from '@/app/actions/category';
import AdminActionForm from '@/components/AdminActionForm';
import AdminCrudModal from '@/components/AdminCrudModal';
import { useConfirm } from '@/components/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

const input = 'admin-crud-input';

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'admin-crud-field admin-crud-field-wide' : 'admin-crud-field'}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function CategoryFormFields({ category }: { category?: CategoryRecord }) {
  return (
    <section className="admin-crud-section">
      <h3>Informasi kategori</h3>
      <div className="admin-crud-grid">
        <Field label="Nama kategori" wide>
          <input name="name" required defaultValue={category?.name} className={input} placeholder="Masukkan nama kategori" />
        </Field>
      </div>
    </section>
  );
}

export function CategoryCreateModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="admin-data-action interactive inline-flex items-center justify-center gap-2" onClick={() => setOpen(true)}>
        <Tag className="size-4" /> Tambah kategori
      </button>
      <AdminCrudModal open={open} onClose={() => setOpen(false)} title="Tambah Kategori" description="Tambahkan kategori barang baru." icon={<Tag />}>
        <AdminActionForm action={createCategory} successMessage="Kategori berhasil ditambahkan." resetOnSuccess onSuccess={() => setOpen(false)} className="admin-crud-form">
          <CategoryFormFields />
          <footer className="admin-crud-footer">
            <button type="button" onClick={() => setOpen(false)} className="admin-crud-cancel">Batal</button>
            <button type="submit" className="admin-crud-submit"><Save /> Simpan kategori</button>
          </footer>
        </AdminActionForm>
      </AdminCrudModal>
    </>
  );
}

export function CategoryRowActions({ category }: { category: CategoryRecord }) {
  const [editOpen, setEditOpen] = useState(false);
  const { confirm, dialog } = useConfirm();
  const router = useRouter();
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (category.productCount > 0) {
      showToast(`Kategori ini sedang digunakan oleh ${category.productCount} barang. Tidak bisa dihapus.`, 'error', 'Gagal');
      return;
    }

    const ok = await confirm({
      title: 'Hapus kategori?',
      message: `Kategori "${category.name}" akan dihapus permanen.\nTindakan ini tidak dapat diurungkan.`,
      confirmLabel: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteCategory(category.id);
      showToast('Kategori berhasil dihapus.', 'success', 'Berhasil');
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus kategori', 'error', 'Error');
    }
  };

  return (
    <div className="admin-row-actions">
      {dialog}
      <button type="button" onClick={() => setEditOpen(true)} aria-label="Edit kategori" title="Edit"><Pencil /></button>
      <button type="button" onClick={handleDelete} className="is-danger" aria-label="Hapus kategori" title="Hapus"><Trash2 /></button>

      <AdminCrudModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Kategori" description="Perbarui informasi kategori barang." icon={<Tag />}>
        <AdminActionForm action={updateCategory.bind(null, category.id)} successMessage="Kategori berhasil diperbarui." onSuccess={() => setEditOpen(false)} className="admin-crud-form">
          <CategoryFormFields category={category} />
          <footer className="admin-crud-footer">
            <button type="button" onClick={() => setEditOpen(false)} className="admin-crud-cancel">Batal</button>
            <button type="submit" className="admin-crud-submit"><Save /> Simpan perubahan</button>
          </footer>
        </AdminActionForm>
      </AdminCrudModal>
    </div>
  );
}
