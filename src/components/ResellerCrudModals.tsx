'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Eye, FilePlus2, Pencil, Save, Trash2, TriangleAlert, UserRound,
} from 'lucide-react';
import { createReseller, deleteReseller, toggleReseller, updateReseller } from '@/app/actions/business';
import AdminActionForm from '@/components/AdminActionForm';
import AdminCrudModal from '@/components/AdminCrudModal';
import ImageUpload from '@/components/ImageUpload';

export interface ResellerRecord {
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

function ResellerFormFields({ reseller }: { reseller?: ResellerRecord }) {
  return <>
    <section className="admin-crud-section">
      <h3>Foto profil</h3>
      <ImageUpload name="imageUrl" defaultValue={reseller?.imageUrl} />
    </section>
    <section className="admin-crud-section">
      <h3>Informasi penjual</h3>
      <div className="admin-crud-grid">
        <Field label="Nama penjual"><input name="name" required defaultValue={reseller?.name} className={input} placeholder="Masukkan nama penjual" /></Field>
        <Field label="No. WhatsApp"><input name="phone" defaultValue={reseller?.phone} className={input} placeholder="Contoh: 081234567890" /></Field>
        <Field label="Alamat" wide><textarea name="address" rows={3} defaultValue={reseller?.address} className="admin-crud-textarea" placeholder="Masukkan alamat penjual" /></Field>
        <Field label="Catatan" wide><textarea name="notes" rows={3} defaultValue={reseller?.notes} className="admin-crud-textarea" placeholder="Catatan tambahan (opsional)" /></Field>
      </div>
    </section>
  </>;
}

export function ResellerCreateModal() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="admin-data-action interactive inline-flex items-center justify-center gap-2" onClick={() => setOpen(true)}>
      <FilePlus2 /> Tambah penjual
    </button>
    <AdminCrudModal open={open} onClose={() => setOpen(false)} title="Tambah Penjual" description="Tambahkan identitas dan foto profil penjual baru." icon={<FilePlus2 />}>
      <AdminActionForm action={createReseller} successMessage="Penjual berhasil ditambahkan." resetOnSuccess onSuccess={() => setOpen(false)} className="admin-crud-form">
        <ResellerFormFields />
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={() => setOpen(false)}>Batal</button>
          <button className="admin-data-action inline-flex items-center gap-2"><Save /> Simpan penjual</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>
  </>;
}

function Profile({ reseller, large = false }: { reseller: ResellerRecord; large?: boolean }) {
  const className = large ? 'customer-avatar customer-avatar-large' : 'customer-avatar';
  return <span className={className}>
    {reseller.imageUrl
      ? <Image src={reseller.imageUrl} alt={'Foto ' + reseller.name} fill sizes={large ? '80px' : '42px'} className="object-cover" />
      : <UserRound />}
  </span>;
}

export function ResellerRowActions({ reseller }: { reseller: ResellerRecord }) {
  const [modal, setModal] = useState<'detail' | 'edit' | 'delete' | null>(null);
  const close = () => setModal(null);
  const createdAt = new Date(reseller.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const updatedAt = new Date(reseller.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return <>
    <div className="admin-row-actions">
      <button type="button" onClick={() => setModal('detail')} aria-label={'Lihat detail ' + reseller.name} title="Lihat detail"><Eye /></button>
      <button type="button" onClick={() => setModal('edit')} aria-label={'Edit ' + reseller.name} title="Edit"><Pencil /></button>
      <AdminActionForm action={toggleReseller.bind(null, reseller.id)} successMessage={reseller.isActive ? 'Penjual berhasil dinonaktifkan.' : 'Penjual berhasil diaktifkan.'} className="contents">
        <button type="submit" role="switch" aria-checked={reseller.isActive} className={'customer-toggle ' + (reseller.isActive ? 'is-on' : 'is-off')} aria-label={(reseller.isActive ? 'Nonaktifkan ' : 'Aktifkan ') + reseller.name} title={reseller.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
          <span className="customer-toggle-thumb" aria-hidden="true" />
        </button>
      </AdminActionForm>
      <button type="button" className="is-danger" onClick={() => setModal('delete')} aria-label={'Hapus ' + reseller.name} title="Hapus"><Trash2 /></button>
    </div>

    <AdminCrudModal open={modal === 'detail'} onClose={close} title="Detail Penjual" description="Informasi lengkap penjual yang tersimpan." icon={<UserRound />} size="medium">
      <div className="admin-crud-detail">
        <section className="customer-detail-profile">
          <Profile reseller={reseller} large />
          <div><h3>{reseller.name}</h3><span className={reseller.isActive ? 'customer-status is-active' : 'customer-status is-inactive'}>{reseller.isActive ? 'Aktif' : 'Nonaktif'}</span></div>
        </section>
        <section>
          <h3>Informasi penjual</h3>
          <dl>
            <div><dt>Nama penjual</dt><dd>{reseller.name}</dd></div>
            <div><dt>WhatsApp</dt><dd>{reseller.phone || '-'}</dd></div>
            <div className="wide"><dt>Alamat</dt><dd>{reseller.address || '-'}</dd></div>
            <div className="wide"><dt>Catatan</dt><dd>{reseller.notes || '-'}</dd></div>
            <div><dt>Dibuat</dt><dd>{createdAt}</dd></div>
            <div><dt>Terakhir diperbarui</dt><dd>{updatedAt}</dd></div>
          </dl>
        </section>
        <footer className="admin-crud-footer"><button type="button" className="admin-crud-secondary" onClick={close}>Tutup</button></footer>
      </div>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'edit'} onClose={close} title="Edit Penjual" description={'Perbarui data ' + reseller.name + '.'} icon={<Pencil />}>
      <AdminActionForm action={updateReseller.bind(null, reseller.id)} successMessage="Data penjual berhasil diperbarui." onSuccess={close} className="admin-crud-form">
        <ResellerFormFields reseller={reseller} />
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-data-action inline-flex items-center gap-2"><Save /> Simpan perubahan</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'delete'} onClose={close} title="Hapus Penjual" description="Tindakan ini tidak dapat dibatalkan." icon={<TriangleAlert />} size="medium">
      <AdminActionForm action={deleteReseller.bind(null, reseller.id)} successMessage="Penjual berhasil dihapus." onSuccess={close} className="admin-crud-delete">
        <span className="admin-crud-danger-icon"><Trash2 /></span>
        <h3>Hapus {reseller.name}?</h3>
        <p>{reseller.transactionCount > 0 ? 'Penjual ini terhubung dengan transaksi sehingga mungkin tidak dapat dihapus. Anda dapat menonaktifkannya agar riwayat tetap aman.' : 'Data identitas dan foto profil penjual akan dihapus permanen dari sistem.'}</p>
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-crud-danger-button inline-flex items-center gap-2"><Trash2 /> Hapus data</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>
  </>;
}

export function ResellerProfile({ reseller }: { reseller: ResellerRecord }) {
  return <div className="customer-table-profile"><Profile reseller={reseller} /><div><strong>{reseller.name}</strong><span>{reseller.notes || 'Tanpa catatan'}</span></div></div>;
}
