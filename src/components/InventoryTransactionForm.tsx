'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { Save, ShoppingCart } from 'lucide-react';
import { createBulkOrder, createBulkPurchase } from '@/app/actions/business';
import AdminActionForm from '@/components/AdminActionForm';
import AdminDatePicker from '@/components/AdminDatePicker';
import AppSelect from '@/components/AppSelect';
import AppCombobox from '@/components/AppCombobox';

export interface InventoryProduct {
  id: number;
  name: string;
  category: string;
  imageUrl: string | null;
  unit: string;
  stock: number;
  buyPrice: number;
  price: number;
}

interface VendorOption { id: number; name: string }

const money = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value);

export function ProductQuantityGrid({ products, mode, quantities, setQuantity, getPrice, setPrice, categories: dbCategories }: {
  products: InventoryProduct[];
  mode: 'purchase' | 'sale';
  quantities: Record<number, number>;
  setQuantity: (id: number, value: number) => void;
  getPrice?: (id: number) => number;
  setPrice?: (id: number, value: number) => void;
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const dbCats = products.map(p => p.category);
    // lowercase them all for the Set
    const allCats = new Set([...dbCategories, ...dbCats].map(c => c.toLowerCase()));
    const sorted = Array.from(allCats).sort((a, b) => {
      if (a === 'udang') return -1;
      if (b === 'udang') return 1;
      return a.localeCompare(b);
    });
    return ['all', ...sorted];
  }, [products, dbCategories]);

  const getCategoryCount = useCallback((cat: string) => {
    if (cat === 'all') return products.length;
    return products.filter(p => p.category.toLowerCase() === cat).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category.toLowerCase() === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="flex flex-col gap-6 p-5 md:flex-row lg:p-6">
      <aside className="shrink-0 md:w-56">
        <ul className="flex flex-col gap-2">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isAll = cat === 'all';
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    activeCategory === cat
                      ? 'bg-slate-900 font-medium text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="capitalize">{isAll ? 'Semua Produk' : cat}</span>
                  <span className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const quantity = quantities[product.id] || 0;
          const unitPrice = getPrice ? getPrice(product.id) : (mode === 'purchase' ? product.buyPrice : product.price);
          const max = mode === 'sale' ? product.stock : undefined;
          
          return (
            <article key={product.id} className="group flex flex-col rounded-[24px] border border-slate-100 bg-white overflow-hidden transition-all hover:border-blue-500 hover:ring-2 hover:ring-blue-500">
              {/* Hidden inputs to submit with form */}
              <input type="hidden" name={`items[${product.id}][price]`} value={unitPrice} />
              
              <div className="relative aspect-[4/3] w-full bg-[#f4f5f7]">
                <span className="absolute right-3 top-3 z-10 rounded-full bg-blue-600/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                  {product.category}
                </span>
                <Image src={product.imageUrl || '/lapak-udang-ikan-logo.png'} alt={product.name} fill sizes="160px" className="object-cover" />
              </div>
              
              <div className="flex flex-col flex-1 p-4">
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-bold text-slate-900">{product.name}</h3>
                      <div className="mt-1 flex items-center text-xs text-slate-500">
                        {mode === 'sale' ? `Stok: ${product.stock.toLocaleString('id-ID')} ${product.unit}` : product.unit}
                      </div>
                    </div>
                    {getPrice && setPrice ? (
                      <div title="Ubah harga" className="group/price">
                        <PriceInput productId={product.id} price={unitPrice} setPrice={setPrice} />
                      </div>
                    ) : (
                      <strong className="text-[15px] font-bold text-slate-900">{money(unitPrice)}</strong>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto pt-2">
                  <QuantityInput
                    productId={product.id}
                    quantity={quantity}
                    unit={product.unit}
                    max={max}
                    setQuantity={setQuantity}
                  />
                </div>
                
                {quantity > 0 && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-medium text-slate-500">Subtotal</span>
                    <strong className="text-sm text-blue-600">{money(quantity * unitPrice)}</strong>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// A dedicated input that supports decimal comma/dot with no spinner arrows
export function QuantityInput({ productId, quantity, unit, max, setQuantity }: {
  productId: number;
  quantity: number;
  unit: string;
  max?: number;
  setQuantity: (id: number, value: number) => void;
}) {
  // Track raw string while user is typing
  const [raw, setRaw] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const parseValue = (str: string) => {
    // Accept both comma and dot as decimal separator
    const normalized = str.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const displayValue = editing ? raw : (quantity > 0 ? String(quantity).replace('.', ',') : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only digits, comma, and dot
    if (/^[0-9]*[,.]?[0-9]*$/.test(val)) {
      setRaw(val);
    }
  };

  const handleFocus = () => {
    setEditing(true);
    setRaw(quantity > 0 ? String(quantity).replace('.', ',') : '');
  };

  const commit = useCallback(() => {
    const parsed = parseValue(raw);
    const clamped = max !== undefined ? Math.min(parsed, max) : parsed;
    setQuantity(productId, Math.max(0, clamped));
    setEditing(false);
  }, [max, productId, raw, setQuantity]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); setRaw(''); }
  };

  const step = unit === 'kg' ? 0.5 : 1;

  return (
    <div className="flex h-10 items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => setQuantity(productId, Math.max(0, parseFloat((quantity - step).toFixed(3))))
        }
        className="flex aspect-square h-full items-center justify-center rounded-[10px] border border-slate-200 bg-white text-lg font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >-</button>
      {/* Hidden input for form submission with the numeric value */}
      <input type="hidden" name={`items[${productId}][quantity]`} value={quantity || 0} />
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        placeholder="0"
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-center text-[15px] !font-semibold text-slate-900 outline-none caret-blue-500"
        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
      />
      <button
        type="button"
        onClick={() => {
          const next = parseFloat((quantity + step).toFixed(3));
          setQuantity(productId, max !== undefined ? Math.min(next, max) : next);
        }}
        className="flex aspect-square h-full items-center justify-center rounded-[10px] border border-emerald-500 bg-white text-lg font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
      >+</button>
    </div>
  );
}

// A dedicated input for price
export function PriceInput({ productId, price, setPrice }: {
  productId: number;
  price: number;
  setPrice: (id: number, value: number) => void;
}) {
  const [raw, setRaw] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const displayValue = editing ? raw : price.toLocaleString('id-ID');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setRaw(val);
  };

  const handleFocus = () => {
    setEditing(true);
    setRaw(String(price));
  };

  const commit = () => {
    const parsed = parseInt(raw, 10);
    setPrice(productId, Number.isFinite(parsed) ? parsed : price);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); setRaw(''); }
  };

  return (
    <div className="flex items-center justify-end gap-1 text-slate-900 group-hover/price:text-blue-600 transition-colors">
      <span className="text-[12px] font-semibold opacity-60">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-[72px] bg-transparent text-right text-[15px] font-bold outline-none caret-blue-500 border-b border-dashed border-slate-300 focus:border-blue-500 focus:border-solid"
      />
    </div>
  );
}

export function useQuantities(products: InventoryProduct[], mode: 'purchase' | 'sale', initialQuantities?: Record<number, number>) {
  const [quantities, setQuantities] = useState<Record<number, number>>(initialQuantities || {});
  const [prices, setPrices] = useState<Record<number, number>>({});

  const setQuantity = (id: number, raw: number) => {
    const product = products.find((item) => item.id === id);
    const maximum = mode === 'sale' ? product?.stock ?? 0 : Number.POSITIVE_INFINITY;
    const value = Number.isFinite(raw) ? Math.max(0, Math.min(raw, maximum)) : 0;
    setQuantities((current) => ({ ...current, [id]: value }));
  };

  const getPrice = useCallback((id: number) => {
    if (prices[id] !== undefined) return prices[id];
    const product = products.find((item) => item.id === id);
    if (!product) return 0;
    return mode === 'purchase' ? product.buyPrice : product.price;
  }, [prices, products, mode]);

  const setPrice = useCallback((id: number, raw: number) => {
    const value = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    setPrices((current) => ({ ...current, [id]: value }));
  }, []);

  const total = useMemo(() => products.reduce((sum, product) => sum + (quantities[product.id] || 0) * getPrice(product.id), 0), [products, quantities, getPrice]);
  const itemCount = Object.values(quantities).filter((value) => value > 0).length;
  return { quantities, setQuantity, prices, setPrice, getPrice, total, itemCount, setQuantities };
}

export function PurchaseInventoryForm({ products, categories }: { products: InventoryProduct[], categories: string[] }) {
  const { quantities, setQuantity, total, itemCount } = useQuantities(products, 'purchase');
  return <AdminActionForm action={createBulkPurchase} successMessage="Pembelian berhasil disimpan dan stok telah ditambahkan." redirectTo="/admin/purchases" className="flex flex-col gap-5">
    <section className="surface p-5 lg:p-6">
      <div className="mb-4"><h2 className="text-sm font-semibold text-blue-950">Informasi pembelian</h2></div>
      <div className="grid items-start gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="admin-crud-field"><span>Tanggal</span><AdminDatePicker name="date" required className="admin-crud-date" /></label>
          <div className="grid grid-cols-2 gap-4 [&_.app-select]:!w-full [&_.app-select-trigger]:!h-[42px] [&_.app-select-trigger]:!min-h-[42px]">
            <label className="admin-crud-field">
              <span>Metode Pembayaran</span>
              <AppSelect name="paymentType" required className="admin-crud-input w-full" options={[{ value: 'TRANSFER', label: 'Transfer' }, { value: 'TUNAI', label: 'Tunai' }]} defaultValue="TUNAI" />
            </label>
            <label className="admin-crud-field">
              <span>Status</span>
              <AppSelect name="status" required className="admin-crud-input w-full" options={[{ value: 'SELESAI', label: 'Selesai' }, { value: 'TUNDA', label: 'Tunda' }, { value: 'BATAL', label: 'Batal' }]} defaultValue="SELESAI" />
            </label>
          </div>
        </div>
        <label className="admin-crud-field">
          <span>Catatan</span>
          <textarea name="notes" className="admin-crud-textarea min-h-[127px] resize-y text-[11px] placeholder:text-[11px]" placeholder="Tambahkan catatan jika ada..." />
        </label>
      </div>
    </section>
    <section className="surface overflow-hidden"><div className="inventory-picker-head"><div><h2>Pilih barang yang dibeli</h2></div><span>{itemCount} barang dipilih</span></div><ProductQuantityGrid products={products} mode="purchase" quantities={quantities} setQuantity={setQuantity} categories={categories} /></section>
    <div className="sticky bottom-8 z-40 mx-auto flex w-max items-center gap-6 rounded-full border border-white/60 bg-white/70 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md"><div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-600">Total pembelian</span><strong className="text-lg font-bold leading-none text-slate-900">{money(total)}</strong></div><button disabled={!itemCount} className="admin-data-action flex items-center justify-center gap-2 !rounded-full !px-8"><Save size={18} /> Simpan pembelian</button></div>
  </AdminActionForm>;
}

export function SalesInventoryForm({ products, categories }: { products: InventoryProduct[], categories: string[] }) {
  const { quantities, setQuantity, getPrice, setPrice, total, itemCount } = useQuantities(products, 'sale');
  return <AdminActionForm action={createBulkOrder} successMessage="Penjualan berhasil disimpan, stok berkurang, dan kas bertambah." redirectTo="/admin/orders" className="flex flex-col gap-5">
    <section className="surface p-5 lg:p-6">
      <div className="mb-4"><h2 className="text-sm font-semibold text-blue-950">Informasi penjualan</h2></div>
      <div className="grid items-start gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="admin-crud-field"><span>Tanggal</span><AdminDatePicker name="date" required className="admin-crud-date" /></label>
          <div className="grid grid-cols-2 gap-4 [&_.app-select]:!w-full [&_.app-select-trigger]:!h-[42px] [&_.app-select-trigger]:!min-h-[42px]">
            <label className="admin-crud-field">
              <span>Metode Pembayaran</span>
              <AppSelect name="paymentType" required className="admin-crud-input w-full" options={[{ value: 'TRANSFER', label: 'Transfer' }, { value: 'TUNAI', label: 'Tunai' }]} defaultValue="TUNAI" />
            </label>
            <label className="admin-crud-field">
              <span>Status</span>
              <AppSelect name="status" required className="admin-crud-input w-full" options={[{ value: 'SELESAI', label: 'Selesai' }, { value: 'TUNDA', label: 'Tunda' }, { value: 'BATAL', label: 'Batal' }]} defaultValue="SELESAI" />
            </label>
          </div>
        </div>
        <label className="admin-crud-field">
          <span>Catatan</span>
          <textarea name="notes" className="admin-crud-textarea min-h-[127px] resize-y text-[11px] placeholder:text-[11px]" placeholder="Tambahkan catatan jika ada..." />
        </label>
      </div>
    </section>
    <section className="surface overflow-hidden"><div className="inventory-picker-head"><div><h2>Pilih barang yang terjual</h2></div><span>{itemCount} barang dipilih</span></div><ProductQuantityGrid products={products} mode="sale" quantities={quantities} setQuantity={setQuantity} getPrice={getPrice} setPrice={setPrice} categories={categories} /></section>
    <div className="sticky bottom-8 z-40 mx-auto flex w-max items-center gap-6 rounded-full border border-white/60 bg-white/70 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md"><div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-600">Total penjualan</span><strong className="text-lg font-bold leading-none text-slate-900">{money(total)}</strong></div><button disabled={!itemCount} className="admin-data-action flex items-center justify-center gap-2 !rounded-full !px-8"><ShoppingCart size={18} /> Konfirmasi penjualan</button></div>
  </AdminActionForm>;
}
