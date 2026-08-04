'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Eye, FilePlus2, Pencil, Save, Trash2, TriangleAlert, UserRound,
} from 'lucide-react';
import { createVendor, deleteVendor, toggleVendor, updateVendor } from '@/app/actions/business';
import AdminActionForm from '@/components/AdminActionForm';
import AdminCrudModal from '@/components/AdminCrudModal';
import ImageUpload from '@/components/ImageUpload';

export interface CustomerRecord {
  id: number;
  name: string;
  imageUrl: string;
  phone: string;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
}

const input = 'admin-crud-input';

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? 'admin-crud-field admin-crud-field-wide' : 'admin-crud-field'}>
    <span>{label}</span>
    {children}
  </label>;
}

function CustomerFormFields({ customer }: { customer?: CustomerRecord }) {
  return <>
    <section className="admin-crud-section">
      <h3>Foto profil</h3>
      <ImageUpload name="imageUrl" defaultValue={customer?.imageUrl} />
    </section>
    <section className="admin-crud-section">
      <h3>Informasi pelanggan</h3>
      <div className="admin-crud-grid">
        <Field label="Nama pelanggan"><input name="name" required defaultValue={customer?.name} className={input} placeholder="Masukkan nama pelanggan" /></Field>
        <Field label="No. WhatsApp"><input name="phone" defaultValue={customer?.phone} className={input} placeholder="Contoh: 081234567890" /></Field>
        <Field label="Alamat" wide><textarea name="address" rows={3} defaultValue={customer?.address} className="admin-crud-textarea" placeholder="Masukkan alamat pelanggan" /></Field>
        <Field label="Catatan" wide><textarea name="notes" rows={3} defaultValue={customer?.notes} className="admin-crud-textarea" placeholder="Catatan tambahan (opsional)" /></Field>
      </div>
    </section>
  </>;
}

export function CustomerCreateModal() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="admin-data-action interactive inline-flex items-center justify-center gap-2" onClick={() => setOpen(true)}>
      <FilePlus2 /> Tambah pelanggan
    </button>
    <AdminCrudModal open={open} onClose={() => setOpen(false)} title="Tambah Pelanggan" description="Tambahkan identitas dan foto profil pelanggan baru." icon={<FilePlus2 />}>
      <AdminActionForm action={createVendor} successMessage="Pelanggan berhasil ditambahkan." resetOnSuccess onSuccess={() => setOpen(false)} className="admin-crud-form">
        <CustomerFormFields />
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={() => setOpen(false)}>Batal</button>
          <button className="admin-data-action inline-flex items-center gap-2"><Save /> Simpan pelanggan</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>
  </>;
}

function Profile({ customer, large = false }: { customer: CustomerRecord; large?: boolean }) {
  const className = large ? 'customer-avatar customer-avatar-large' : 'customer-avatar';
  return <span className={className}>
    {customer.imageUrl
      ? <Image src={customer.imageUrl} alt={'Foto ' + customer.name} fill sizes={large ? '80px' : '42px'} className="object-cover" />
      : <UserRound />}
  </span>;
}

export function CustomerRowActions({ customer }: { customer: CustomerRecord }) {
  const [modal, setModal] = useState<'detail' | 'edit' | 'delete' | null>(null);
  const close = () => setModal(null);
  const createdAt = new Date(customer.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const updatedAt = new Date(customer.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return <>
    <div className="admin-row-actions">
      <button type="button" onClick={() => setModal('detail')} aria-label={'Lihat detail ' + customer.name} title="Lihat detail"><Eye /></button>
      <button type="button" onClick={() => setModal('edit')} aria-label={'Edit ' + customer.name} title="Edit"><Pencil /></button>
      <AdminActionForm action={toggleVendor.bind(null, customer.id)} successMessage={customer.isActive ? 'Pelanggan berhasil dinonaktifkan.' : 'Pelanggan berhasil diaktifkan.'} className="contents">
        <button type="submit" role="switch" aria-checked={customer.isActive} className={'customer-toggle ' + (customer.isActive ? 'is-on' : 'is-off')} aria-label={(customer.isActive ? 'Nonaktifkan ' : 'Aktifkan ') + customer.name} title={customer.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
          <span className="customer-toggle-thumb" aria-hidden="true" />
        </button>
      </AdminActionForm>
      <button type="button" className="is-danger" onClick={() => setModal('delete')} aria-label={'Hapus ' + customer.name} title="Hapus"><Trash2 /></button>
    </div>

    <AdminCrudModal open={modal === 'detail'} onClose={close} title="Detail Pelanggan" description="Informasi lengkap pelanggan yang tersimpan." icon={<UserRound />} size="medium">
      <div className="admin-crud-detail">
        <section className="customer-detail-profile">
          <Profile customer={customer} large />
          <div><h3>{customer.name}</h3><span className={customer.isActive ? 'customer-status is-active' : 'customer-status is-inactive'}>{customer.isActive ? 'Aktif' : 'Nonaktif'}</span></div>
        </section>
        <section>
          <h3>Informasi pelanggan</h3>
          <dl>
            <div><dt>Nama pelanggan</dt><dd>{customer.name}</dd></div>
            <div><dt>WhatsApp</dt><dd>{customer.phone || '-'}</dd></div>
            <div className="wide"><dt>Alamat</dt><dd>{customer.address || '-'}</dd></div>
            <div className="wide"><dt>Catatan</dt><dd>{customer.notes || '-'}</dd></div>
            <div><dt>Dibuat</dt><dd>{createdAt}</dd></div>
            <div><dt>Terakhir diperbarui</dt><dd>{updatedAt}</dd></div>
          </dl>
        </section>
        <footer className="admin-crud-footer"><button type="button" className="admin-crud-secondary" onClick={close}>Tutup</button></footer>
      </div>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'edit'} onClose={close} title="Edit Pelanggan" description={'Perbarui data ' + customer.name + '.'} icon={<Pencil />}>
      <AdminActionForm action={updateVendor.bind(null, customer.id)} successMessage="Data pelanggan berhasil diperbarui." onSuccess={close} className="admin-crud-form">
        <CustomerFormFields customer={customer} />
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-data-action inline-flex items-center gap-2"><Save /> Simpan perubahan</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'delete'} onClose={close} title="Hapus Pelanggan" description="Tindakan ini tidak dapat dibatalkan." icon={<TriangleAlert />} size="medium">
      <AdminActionForm action={deleteVendor.bind(null, customer.id)} successMessage="Pelanggan berhasil dihapus." onSuccess={close} className="admin-crud-delete">
        <span className="admin-crud-danger-icon"><Trash2 /></span>
        <h3>Hapus {customer.name}?</h3>
        <p>{customer.transactionCount > 0 ? 'Pelanggan ini terhubung dengan transaksi sehingga mungkin tidak dapat dihapus. Anda dapat menonaktifkannya agar riwayat tetap aman.' : 'Data identitas dan foto profil pelanggan akan dihapus permanen dari sistem.'}</p>
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-crud-danger-button inline-flex items-center gap-2"><Trash2 /> Hapus data</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>
  </>;
}

export function CustomerProfile({ customer }: { customer: CustomerRecord }) {
  return <div className="customer-table-profile"><Profile customer={customer} /><div><strong>{customer.name}</strong><span>{customer.notes || 'Tanpa catatan'}</span></div></div>;
}
