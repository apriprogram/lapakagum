import Link from 'next/link';
import { Calculator, Save } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import AppSelect from '@/components/AppSelect';
import AdminActionForm from '@/components/AdminActionForm';
import CurrencyInput from '@/components/CurrencyInput';

interface ProductFormProps {
  action: (formData: FormData) => void | Promise<void>;
  categories: { value: string; label: string }[];
  product?: {
    name: string;
    category: string;
    buyPrice: number;
    price: number;
    unit: string;
    imageUrl: string | null;
  };
}

export default function ProductForm({ action, categories, product }: ProductFormProps) {
  const field = 'h-11 w-full rounded-xl border border-[#ccd4df] bg-white px-4 text-sm outline-none transition-colors hover:border-[#98a1b2] focus:border-[#246bfd] focus:outline focus:outline-3 focus:outline-blue-100';
  return (
    <AdminActionForm action={action} successMessage={product ? 'Barang berhasil diperbarui.' : 'Barang berhasil ditambahkan.'} redirectTo="/admin/stock" className="surface overflow-hidden">
      <div className="grid gap-6 p-5 md:grid-cols-2 lg:p-7">
        <input type="hidden" name="unit" value={product?.unit || 'kg'} />
        <label className="text-sm font-medium text-slate-700">Nama barang
          <input name="name" required defaultValue={product?.name} className={`mt-2 ${field}`} placeholder="Contoh: Udang Vaname" />
        </label>
        <label className="text-sm font-medium text-slate-700">Kategori
          <AppSelect name="category" required defaultValue={product?.category || (categories[0]?.value ?? 'udang')} className={`mt-2 ${field}`} options={categories} />
        </label>
        <label className="text-sm font-medium text-slate-700">Harga beli
          <CurrencyInput name="buyPrice" required defaultValue={product?.buyPrice} className={`mt-2 ${field}`} placeholder="Rp 70.000" />
        </label>
        <label className="text-sm font-medium text-slate-700">Harga jual
          <CurrencyInput name="price" required defaultValue={product?.price} className={`mt-2 ${field}`} placeholder="Rp 85.000" />
        </label>
        <div className="md:col-span-2"><p className="mb-2 text-sm font-medium text-slate-700">Foto barang</p><ImageUpload name="imageUrl" defaultValue={product?.imageUrl || undefined} /></div>
        <div className="md:col-span-2 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-5 text-slate-600">
          <Calculator className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p>Sisa stok, jumlah beli, jumlah jual, untung satuan, dan total untung dihitung otomatis dari transaksi pembelian dan penjualan.</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-blue-100 bg-blue-50/30 px-5 py-4 lg:px-7">
        <Link href="/admin/stock" className="interactive rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-blue-300">Batal</Link>
        <button className="admin-data-action interactive flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Save className="size-4" /> Simpan barang</button>
      </div>
    </AdminActionForm>
  );
}
