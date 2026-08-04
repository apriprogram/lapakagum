import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { currency, number } from '@/lib/format';
import { deleteProduct } from '@/app/actions/product';
import AdminActionForm from '@/components/AdminActionForm';
import AdminDataTable from '@/components/AdminDataTable';
import StockDetailModal from '@/components/StockDetailModal';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const [products, batches] = await Promise.all([
    prisma.product.findMany({
      include: {
        purchaseItems: { select: { quantity: true } },
        orderItems: { where: { order: { status: 'SELESAI' } }, select: { quantity: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.stockBatch.findMany({ 
      where: { remainingQty: { gt: 0 } }, 
      include: { product: true }, 
      orderBy: { receivedAt: 'asc' }
    })
  ]);

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-blue-600">Persediaan</p><h1 className="mt-1 text-2xl font-semibold text-blue-950">Stok Barang</h1><p className="mt-2 text-sm text-slate-500">Kelola data barang, patokan harga, stok, dan keuntungan dalam satu halaman.</p></div>
      <Link href="/admin/stock/new" className="admin-data-action interactive inline-flex items-center justify-center gap-2"><Plus /> Tambah barang</Link>
    </div>

    <section className="surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4"><span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Boxes className="size-4" /></span><div><h2 className="text-sm font-semibold text-blue-950">Daftar stok barang</h2><p className="mt-1 text-[11px] text-slate-400">{products.length} barang tersimpan</p></div></div>
      <AdminDataTable title="Daftar stok barang">
        <table className="w-full min-w-[1480px] text-left text-sm">
          <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400"><tr>
            <th data-table-control><input type="checkbox" data-select-all className="admin-table-checkbox" aria-label="Pilih semua barang" /></th><th className="px-3 py-3">No.</th><th className="px-4 py-3">Foto</th><th className="px-4 py-3">Nama barang</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Sisa stok</th><th className="px-4 py-3">Harga beli</th><th className="px-4 py-3">Harga jual</th><th className="px-4 py-3">Untung satuan</th><th className="px-4 py-3">Jumlah beli</th><th className="px-4 py-3">Jumlah jual</th><th className="px-4 py-3">Total untung</th><th className="px-4 py-3 text-right">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-blue-50">
            {products.map((item) => {
              const itemBatches = batches.filter(b => b.productId === item.id);
              const remaining = Number(item.stock); // Sisa stok tetap dari master untuk akurasi
              const purchased = itemBatches.reduce((sum, b) => sum + Number(b.initialQty), 0);
              const sold = purchased >= remaining ? purchased - remaining : 0;
              const unitProfit = Number(item.price) - Number(item.buyPrice);
              const totalProfit = unitProfit * sold;
              return <tr key={item.id} data-table-row className="hover:bg-blue-50/30">
                <td data-table-control><input type="checkbox" data-row-select value={item.id} className="admin-table-checkbox" aria-label={'Pilih ' + item.name} /></td><td data-row-number className="px-3 py-4" />
                <td className="px-4 py-3"><span className="relative block size-11 overflow-hidden rounded-lg border border-blue-100 bg-blue-50"><Image src={item.imageUrl || '/lapak-udang-ikan-logo.png'} alt={item.name} fill sizes="44px" className="object-cover" /></span></td>
                <td className="px-4 py-3"><p className="font-medium text-blue-950">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.unit}</p></td>
                <td className="px-4 py-3 text-xs text-slate-600">{item.category}</td><td className="px-4 py-3 font-semibold text-blue-950">{number(remaining)} {item.unit}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{currency(Number(item.buyPrice))}</td><td className="px-4 py-3 text-xs text-slate-600">{currency(Number(item.price))}</td><td className="px-4 py-3 font-medium text-emerald-700">{currency(unitProfit)}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{number(purchased)} {item.unit}</td><td className="px-4 py-3 text-xs text-slate-600">{number(sold)} {item.unit}</td><td className="px-4 py-3 font-semibold text-emerald-700">{currency(totalProfit)}</td>
                <td className="px-4 py-3"><div className="admin-row-actions justify-end"><StockDetailModal product={{ name: item.name, category: item.category, unit: item.unit, imageUrl: item.imageUrl, buyPrice: Number(item.buyPrice), price: Number(item.price), remaining, purchased, sold, unitProfit, totalProfit }} /><Link href={'/admin/stock/' + item.id} aria-label={'Edit ' + item.name} title="Edit"><Pencil /></Link><AdminActionForm action={deleteProduct.bind(null, item.id)} successMessage="Barang berhasil dihapus atau dinonaktifkan." confirmMessage={'Hapus ' + item.name + '?'}><button className="is-danger" aria-label={'Hapus ' + item.name} title="Hapus"><Trash2 /></button></AdminActionForm></div></td>
              </tr>;
            })}
            {!products.length && <tr><td colSpan={13} className="px-5 py-14 text-center text-slate-400">Belum ada barang.</td></tr>}
          </tbody>
        </table>
      </AdminDataTable>
    </section>

    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-blue-950">Stok yang belum terjual</h2>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Total: {number(products.reduce((sum, item) => sum + Number(item.stock), 0))} kg
        </div>
      </div>
      <div className="grid gap-px bg-blue-100 sm:grid-cols-2 xl:grid-cols-5">
        {products.filter(item => Number(item.stock) > 0).map((product) => {
          const itemBatches = batches.filter(b => b.productId === product.id);
          const remaining = Number(product.stock);
          const potential = remaining * Number(product.price);
          const profit = remaining * (Number(product.price) - Number(product.buyPrice));
          return (
            <article key={product.id} className="bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-semibold text-blue-950">{product.name}</p><p className="mt-1 text-[10px] text-slate-400">{itemBatches.length} kelompok stok</p></div>
                {remaining <= 5 && <AlertTriangle className="size-4 text-amber-500" />}
              </div>
              <p className="mt-5 text-2xl font-semibold text-blue-950">{number(remaining)} <span className="text-xs font-normal text-slate-400">{product.unit}</span></p>
              <div className="mt-4 space-y-2 text-[11px]"><p className="flex justify-between text-slate-500"><span>Perkiraan nilai penjualan</span><span className="font-medium text-blue-950">{currency(potential)}</span></p><p className="flex justify-between text-slate-500"><span>Perkiraan keuntungan</span><span className="font-medium text-emerald-700">{currency(profit)}</span></p></div>
            </article>
          );
        })}
        {!products.some(item => Number(item.stock) > 0) && <div className="col-span-full bg-white p-10 text-center text-sm text-slate-400">Tidak ada stok tersisa.</div>}
      </div>
    </section>
  </div>;
}

