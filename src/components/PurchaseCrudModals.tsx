'use client';

import { useMemo, useState } from 'react';
import {
  Calculator, Eye, Pencil, Save, ShoppingCart, Trash2, TriangleAlert,
} from 'lucide-react';
import { deletePurchase, updatePurchase } from '@/app/actions/business';
import AdminActionForm from '@/components/AdminActionForm';
import AdminCrudModal from '@/components/AdminCrudModal';
import AdminDatePicker from '@/components/AdminDatePicker';
import AppSelect from '@/components/AppSelect';
import { QuantityInput } from '@/components/InventoryTransactionForm';

interface Option {
  id: number;
  name: string;
  unit?: string;
  imageUrl?: string | null;
}

interface PurchaseRecord {
  id: number;
  invoiceNumber: string;
  date: string;

  productId: number;
  productName: string;
  unit: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  totalLabel: string;
  paymentType: string;
  paymentLabel: string;
  ownership: string;
  ownershipLabel: string;
  notes: string;
  editable: boolean;
  itemsRaw?: { productId: number; quantity: number; buyPrice?: number }[];
  status?: string;
}

const input = 'admin-crud-input';
const paymentOptions = [
  { value: 'TUNAI', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer' },
];
const statusOptions = [
  { value: 'TUNDA', label: 'Tunda' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'BATAL', label: 'Batal' },
];

function Field({ label, children, wide = false, hideLabel = false }: { label: string; children: React.ReactNode; wide?: boolean; hideLabel?: boolean }) {
  return <label className={wide ? 'admin-crud-field admin-crud-field-wide' : 'admin-crud-field'}>
    {!hideLabel && <span>{label}</span>}
    {children}
  </label>;
}

function PurchaseFields({
  products,
  initial,
}: {
  products: Option[];
  initial?: PurchaseRecord;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (initial?.itemsRaw) {
      for (const item of initial.itemsRaw) {
        init[String(item.productId)] = item.quantity;
      }
    } else if (initial) {
      init[String(initial.productId)] = initial.quantity;
    }
    return init;
  });
  
  const handleQuantityChange = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const itemsToRender = initial?.itemsRaw && initial.itemsRaw.length > 0 
    ? initial.itemsRaw 
    : (initial ? [{ productId: initial.productId, quantity: initial.quantity }] : []);

  return <>
    <section className="admin-crud-section">
      <h3>Informasi pembelian</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Tanggal"><AdminDatePicker name="date" required defaultValue={initial?.date || new Date().toISOString().slice(0, 10)} className="admin-crud-date" /></Field>
        <Field label="Pembayaran"><AppSelect name="paymentType" defaultValue={initial?.paymentType || 'TUNAI'} className={input} options={paymentOptions} /></Field>
        <Field label="Status"><AppSelect name="status" defaultValue={initial?.status || 'SELESAI'} className={input} options={statusOptions} /></Field>
      </div>
    </section>
    
    <section className="admin-crud-section">
      <h3>Rincian item</h3>
      <div className="flex flex-col gap-2">
        {itemsToRender.map((item, idx) => {
          const selectedProduct = products.find(p => p.id === item.productId);
          const unit = selectedProduct?.unit || 'kg';
          const currentQuantity = quantities[String(item.productId)] || 0;
          return (
            <div key={idx} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex-1">
                <Field label="Produk" hideLabel={idx > 0}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                    {selectedProduct?.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct?.name || ''} className="size-10 object-cover bg-white" />
                    ) : (
                      <div className="flex size-10 items-center justify-center bg-slate-200 text-slate-400">
                        <ShoppingCart className="size-4" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">{selectedProduct?.name || 'Produk tidak ditemukan'}</span>
                    </div>
                  </div>
                </Field>
              </div>
              <div className="w-full sm:w-36">
                <Field label="Berat" hideLabel={idx > 0}>
                  <QuantityInput
                    productId={item.productId}
                    quantity={currentQuantity}
                    unit={unit}
                    setQuantity={(id, val) => handleQuantityChange(String(id), val)}
                  />
                </Field>
              </div>
            </div>
          );
        })}
        {itemsToRender.map((item) => {
          const buyPrice = (item as any).buyPrice || initial?.buyPrice || 0;
          return (
            <div key={item.productId}>
              <input type="hidden" name={`items[${item.productId}][quantity]`} value={quantities[String(item.productId)] || 0} />
              <input type="hidden" name={`items[${item.productId}][buyPrice]`} value={buyPrice} />
            </div>
          );
        })}
      </div>
    </section>

    <section className="admin-crud-section">
      <h3>Catatan tambahan</h3>
      <div className="admin-crud-grid">
        <Field label="Catatan" wide><textarea name="notes" rows={3} defaultValue={initial?.notes || ''} className="admin-crud-textarea" /></Field>
      </div>
    </section>
  </>;
}



export function PurchaseRowActions({
  purchase,
  products,
}: {
  purchase: PurchaseRecord;
  products: Option[];
}) {
  const [modal, setModal] = useState<'detail' | 'edit' | 'delete' | null>(null);
  const close = () => setModal(null);
  const dateLabel = new Date(purchase.date + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return <>
    <div className="admin-row-actions">
      <button type="button" onClick={() => setModal('detail')} aria-label={'Lihat detail ' + purchase.invoiceNumber} title="Lihat detail"><Eye /></button>
      <button type="button" onClick={() => setModal('edit')} aria-label={'Edit ' + purchase.invoiceNumber} title="Edit"><Pencil /></button>
      <button type="button" className="is-danger" onClick={() => setModal('delete')} aria-label={'Hapus ' + purchase.invoiceNumber} title="Hapus"><Trash2 /></button>
    </div>

    <AdminCrudModal open={modal === 'detail'} onClose={close} title="Detail Pembelian" description={purchase.invoiceNumber} icon={<ShoppingCart />} size="medium">
      <div className="admin-crud-detail">
        <section>
          <h3>Informasi transaksi</h3>
          <dl>
            <div><dt>Nomor pembelian</dt><dd>{purchase.invoiceNumber}</dd></div>
            <div><dt>Tanggal</dt><dd>{dateLabel}</dd></div>
            
            <div><dt>Pembayaran</dt><dd>{purchase.paymentLabel}</dd></div>
          </dl>
        </section>
        <section>
          <h3>Rincian barang</h3>
          {purchase.itemsRaw && purchase.itemsRaw.length > 0 ? (
            <div className="flex flex-col gap-3">
              {purchase.itemsRaw.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                const subtotal = item.quantity * (item.buyPrice || 0);
                return (
                  <dl key={idx} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                    <div><dt>Produk</dt><dd className="font-semibold text-blue-700">{product?.name || '-'}</dd></div>
                    <div><dt>Jumlah</dt><dd>{item.quantity} {product?.unit || 'kg'}</dd></div>
                    <div><dt>Harga beli</dt><dd>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.buyPrice || 0)}</dd></div>
                    <div><dt>Subtotal</dt><dd className="strong">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(subtotal)}</dd></div>
                  </dl>
                );
              })}
              <dl className="mt-2 border-t border-slate-200 pt-3">
                <div><dt>Total Keseluruhan</dt><dd className="strong text-emerald-700">{purchase.totalLabel}</dd></div>
                <div className="wide"><dt>Catatan</dt><dd>{purchase.notes || '-'}</dd></div>
              </dl>
            </div>
          ) : (
            <dl>
              <div><dt>Produk</dt><dd>{purchase.productName}</dd></div>
              <div><dt>Jumlah</dt><dd>{purchase.quantity} {purchase.unit}</dd></div>
              <div><dt>Harga beli</dt><dd>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(purchase.buyPrice)}</dd></div>
              <div><dt>Total</dt><dd className="strong">{purchase.totalLabel}</dd></div>
              <div className="wide"><dt>Catatan</dt><dd>{purchase.notes || '-'}</dd></div>
            </dl>
          )}
        </section>
        <footer className="admin-crud-footer"><button type="button" className="admin-crud-secondary" onClick={close}>Tutup</button></footer>
      </div>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'edit'} onClose={close} title="Edit Pembelian" description={'Perbarui data ' + purchase.invoiceNumber + '.'} icon={<Pencil />}>
      <AdminActionForm action={updatePurchase.bind(null, purchase.id)} successMessage="Data pembelian berhasil diperbarui." onSuccess={close} className="admin-crud-form">
        {!purchase.editable && <div className="admin-crud-warning"><TriangleAlert /> Stok pembelian ini sudah terpakai atau memiliki pembayaran. Penyimpanan perubahan akan ditolak untuk menjaga konsistensi data.</div>}
        <PurchaseFields products={products} initial={purchase} />
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-data-action inline-flex items-center gap-2"><Save /> Simpan perubahan</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'delete'} onClose={close} title="Hapus Pembelian" description="Tindakan ini tidak dapat dibatalkan." icon={<TriangleAlert />} size="medium">
      <AdminActionForm action={deletePurchase.bind(null, purchase.id)} successMessage="Data pembelian berhasil dihapus." onSuccess={close} className="admin-crud-delete">
        <span className="admin-crud-danger-icon"><Trash2 /></span>
        <h3>Hapus {purchase.invoiceNumber}?</h3>
        <p>Data pembelian dan stok masuk terkait akan dihapus. Pembelian yang stoknya sudah digunakan tidak dapat dihapus.</p>
        {!purchase.editable && <div className="admin-crud-warning"><TriangleAlert /> Data ini kemungkinan tidak dapat dihapus karena stoknya sudah terpakai atau memiliki pembayaran.</div>}
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-crud-danger-button inline-flex items-center gap-2"><Trash2 /> Hapus data</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>
  </>;
}

