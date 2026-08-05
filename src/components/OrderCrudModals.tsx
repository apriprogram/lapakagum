'use client';

import { useState } from 'react';
import {
  Eye, Pencil, ReceiptText, Save, ShoppingCart, Trash2, TriangleAlert,
} from 'lucide-react';
import { deleteOrder, updateOrder } from '@/app/actions/business';
import AdminActionForm from '@/components/AdminActionForm';
import AdminCrudModal from '@/components/AdminCrudModal';
import AdminDatePicker from '@/components/AdminDatePicker';
import AppSelect from '@/components/AppSelect';
import { QuantityInput, PriceInput } from '@/components/InventoryTransactionForm';

interface ProductOption {
  id: number;
  name: string;
  stock: number;
  unit: string;
  price: number;
  imageUrl?: string | null;
}

interface OrderRecord {
  id: number;
  orderNumber: string;
  createdAt: string;
  notes: string;
  paymentType: string;
  paymentLabel: string;
  status: string;
  statusLabel: string;
  totalLabel: string;
  profitLabel: string;
  productsLabel: string;
  productId: number;
  quantity: number;
  canEditItem: boolean;
  itemsRaw?: { productId: number; quantity: number; price?: number; productName?: string; productUnit?: string; productImageUrl?: string | null }[];
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

function OrderFields({ order, products }: { order: OrderRecord, products: ProductOption[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (order.itemsRaw) {
      for (const item of order.itemsRaw) {
        init[String(item.productId)] = item.quantity;
      }
    } else {
      init[String(order.productId)] = order.quantity;
    }
    return init;
  });

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (order.itemsRaw) {
      for (const item of order.itemsRaw) {
        if (item.price !== undefined) {
          init[String(item.productId)] = item.price;
        }
      }
    }
    return init;
  });

  const handleQuantityChange = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const handlePriceChange = (productId: string, val: number) => {
    setPrices(prev => ({ ...prev, [productId]: val }));
  };

  const itemsToRender = order.itemsRaw && order.itemsRaw.length > 0 
    ? order.itemsRaw 
    : [{ productId: order.productId, quantity: order.quantity }];

  return (
    <>
      <section className="admin-crud-section">
        <h3>Rincian transaksi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Tanggal">
            <AdminDatePicker name="date" required defaultValue={order.createdAt.split('T')[0]} className="admin-crud-date" />
          </Field>
          <Field label="Pembayaran"><AppSelect name="paymentType" defaultValue={order.paymentType} className={input} options={paymentOptions} /></Field>
          <Field label="Status"><AppSelect name="status" defaultValue={order.status} className={input} options={statusOptions} /></Field>
        </div>
      </section>
      {order.canEditItem && <section className="admin-crud-section">
        <h3>Rincian item</h3>
        <div className="flex flex-col gap-2">
          {itemsToRender.map((item, idx) => {
            const selectedProduct = products.find(p => p.id === item.productId);
            const unit = selectedProduct?.unit || item.productUnit || 'kg';
            const currentQuantity = quantities[String(item.productId)] || 0;
            const currentPrice = prices[String(item.productId)] ?? (item.price ?? selectedProduct?.price ?? 0);
            return (
              <div key={idx} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex-1">
                  <Field label="Produk" hideLabel={idx > 0}>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      {(selectedProduct?.imageUrl || item.productImageUrl) ? (
                        <img src={selectedProduct?.imageUrl || item.productImageUrl!} alt={selectedProduct?.name || item.productName || ''} className="size-10 object-cover bg-white" />
                      ) : (
                        <div className="flex size-10 items-center justify-center bg-slate-200 text-slate-400">
                          <ShoppingCart className="size-4" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{selectedProduct?.name || item.productName || 'Produk tidak ditemukan'}</span>
                      </div>
                    </div>
                  </Field>
                </div>
                <div className="w-full sm:w-28">
                  <Field label="Harga Satuan" hideLabel={idx > 0}>
                    <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3">
                      <PriceInput productId={item.productId} price={currentPrice} setPrice={(id, val) => handlePriceChange(String(id), val)} />
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
          {itemsToRender.map((item) => (
            <div key={item.productId}>
              <input type="hidden" name={`items[${item.productId}][quantity]`} value={quantities[String(item.productId)] || 0} />
              <input type="hidden" name={`items[${item.productId}][price]`} value={prices[String(item.productId)] ?? (products.find(p => p.id === item.productId)?.price || 0)} />
            </div>
          ))}
        </div>
      </section>}
      <section className="admin-crud-section">
        <h3>Catatan tambahan</h3>
        <div className="admin-crud-grid">
          <Field label="Catatan" wide><textarea name="notes" rows={3} defaultValue={order.notes} className="admin-crud-textarea" /></Field>
        </div>
      </section>
    </>
  );
}

export function OrderRowActions({ order, products }: { order: OrderRecord; products: ProductOption[] }) {
  const [modal, setModal] = useState<'detail' | 'edit' | 'delete' | null>(null);
  const close = () => setModal(null);
  const createdAt = new Date(order.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return <>
    <div className="admin-row-actions">
      <button type="button" onClick={() => setModal('detail')} aria-label={'Lihat detail ' + order.orderNumber} title="Lihat detail"><Eye /></button>
      <button type="button" onClick={() => setModal('edit')} aria-label={'Edit ' + order.orderNumber} title="Edit"><Pencil /></button>
      <button type="button" className="is-danger" onClick={() => setModal('delete')} aria-label={'Hapus ' + order.orderNumber} title="Hapus"><Trash2 /></button>
    </div>

    <AdminCrudModal open={modal === 'detail'} onClose={close} title="Detail Penjualan" description={order.orderNumber} icon={<ReceiptText />} size="medium">
      <div className="admin-crud-detail">
        <section>
          <h3>Informasi transaksi</h3>
          <dl>
            <div><dt>Nomor pesanan</dt><dd>{order.orderNumber}</dd></div>
            <div><dt>Tanggal</dt><dd>{createdAt}</dd></div>
            <div className="wide"><dt>Status</dt><dd><span className={'admin-crud-status status-' + order.status.toLowerCase()}>{order.statusLabel}</span></dd></div>
          </dl>
        </section>
        <section>
          <h3>Rincian pesanan</h3>
          <dl>
            <div className="wide"><dt>Produk</dt><dd>{order.productsLabel}</dd></div>
            <div><dt>Pembayaran</dt><dd>{order.paymentLabel}</dd></div>
            <div><dt>Total</dt><dd className="strong">{order.totalLabel}</dd></div>
            <div><dt>Laba</dt><dd>{order.profitLabel}</dd></div>
            <div className="wide"><dt>Catatan</dt><dd>{order.notes || '-'}</dd></div>
          </dl>
        </section>
        <footer className="admin-crud-footer"><button type="button" className="admin-crud-secondary" onClick={close}>Tutup</button></footer>
      </div>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'edit'} onClose={close} title="Edit Penjualan" description={'Perbarui data ' + order.orderNumber + '.'} icon={<Pencil />}>
      <AdminActionForm action={updateOrder.bind(null, order.id)} successMessage="Data penjualan berhasil diperbarui." onSuccess={close} className="admin-crud-form">
        <OrderFields order={order} products={products} />
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-data-action inline-flex items-center gap-2"><Save /> Simpan perubahan</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>

    <AdminCrudModal open={modal === 'delete'} onClose={close} title="Hapus Penjualan" description="Tindakan ini tidak dapat dibatalkan." icon={<TriangleAlert />} size="medium">
      <AdminActionForm action={deleteOrder.bind(null, order.id)} successMessage="Data penjualan berhasil dihapus." onSuccess={close} className="admin-crud-delete">
        <span className="admin-crud-danger-icon"><Trash2 /></span>
        <h3>Hapus {order.orderNumber}?</h3>
        <p>Data penjualan, pergerakan stok, dan catatan kas terkait akan dihapus. Stok dari penjualan selesai akan dikembalikan.</p>
        <footer className="admin-crud-footer">
          <button type="button" className="admin-crud-secondary" onClick={close}>Batal</button>
          <button className="admin-crud-danger-button inline-flex items-center gap-2"><Trash2 /> Hapus data</button>
        </footer>
      </AdminActionForm>
    </AdminCrudModal>
  </>;
}




