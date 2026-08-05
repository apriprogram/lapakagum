import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Download, Landmark } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { currency, endOfDay, startOfDay } from '@/lib/format';
import AppSelect from '@/components/AppSelect';
import AdminDatePicker from '@/components/AdminDatePicker';
import AdminMonthPicker from '@/components/AdminMonthPicker';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStr = params.month || defaultMonth;
  const [year, monthIdx] = monthStr.split('-').map(Number);
  
  const from = startOfDay(new Date(year, monthIdx - 1, 1));
  const to = endOfDay(new Date(year, monthIdx, 0));
  
  const type = params.type || '';
  const [orders, purchases, cash, batches, capital] = await Promise.all([
    type === 'pembelian' ? Promise.resolve([]) : prisma.order.findMany({ where: { status: 'SELESAI', OR: [{ completedAt: { gte: from, lte: to } }, { completedAt: null, createdAt: { gte: from, lte: to } }] }, include: { items: true } }),
    type === 'penjualan' ? Promise.resolve([]) : prisma.purchase.findMany({ where: { date: { gte: from, lte: to } } }),
    prisma.cashTransaction.findMany({ where: { date: { gte: from, lte: to } } }),
    prisma.stockBatch.findMany({ where: { remainingQty: { gt: 0 } } }),
    prisma.capitalTransaction.findMany(),
  ]);
  const sales = orders.reduce((sum,item) => sum + Number(item.totalAmount),0);
  const purchase = purchases.reduce((sum,item) => sum + Number(item.totalAmount),0);
  const operatingExpense = cash.filter((item) => item.type === 'KELUAR' && !['Pembelian stok','Pembayaran hutang vendor','Prive'].includes(item.category)).reduce((sum,item) => sum + Number(item.amount),0);
  const gross = orders.reduce((sum,item) => sum + Number(item.grossProfit), 0);
  const hpp = sales - gross;
  const net = gross - operatingExpense;
  const cashIn = cash.filter((item) => item.type === 'MASUK').reduce((sum,item) => sum + Number(item.amount),0);
  const cashOut = cash.filter((item) => item.type === 'KELUAR').reduce((sum,item) => sum + Number(item.amount),0);
  const inventory = batches.reduce((sum,item) => sum + Number(item.remainingQty)*Number(item.buyPrice),0);
  const ownerCapital = capital.reduce((sum,item) => sum + (item.type === 'PRIVE' ? -Number(item.amount) : Number(item.amount)),0);
  const toWibDateString = (date: Date | null) => date ? new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10) : '';
  const days = Array.from({ length: to.getDate() }, (_,index) => {
    const day = new Date(year, monthIdx - 1, index + 1);
    const dayStr = toWibDateString(day);
    const dailyOrders = orders.filter((order) => toWibDateString(order.completedAt || order.createdAt) === dayStr);
    const dailyPurchases = purchases.filter((p) => toWibDateString(p.date) === dayStr);
    const value = dailyOrders.reduce((sum,item) => sum+Number(item.totalAmount),0);
    const cost = dailyPurchases.reduce((sum,item) => sum+Number(item.totalAmount),0);
    return { label: String(day.getDate()), value, cost };
  });
  const max = Math.max(...days.map((item)=>Math.max(item.value, item.cost)),1);
  const fromStr = `${year}-${String(monthIdx).padStart(2, '0')}-01`;
  const toStr = `${year}-${String(monthIdx).padStart(2, '0')}-${String(new Date(year, monthIdx, 0).getDate()).padStart(2, '0')}`;
  const query = new URLSearchParams({ from: fromStr, to: toStr, ...(type ? { type } : {}) }).toString();
  const input='h-10 rounded-xl border border-blue-100 bg-white px-3 text-xs outline-none focus:border-blue-500';
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-blue-600">Analisis usaha</p><h1 className="mt-1 text-2xl font-semibold text-blue-950">Laporan</h1><p className="mt-2 text-sm text-slate-500">Lihat hasil penjualan, modal barang, biaya, arus uang, serta perkiraan aset dan hutang.</p></div><div className="flex gap-2"><Link href={`/api/reports/export?${query}&format=pdf`} target="_blank" className="interactive flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Download className="size-4" /> PDF</Link><Link href={`/api/reports/export?${query}&format=excel`} className="interactive flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><Download className="size-4" /> Excel</Link></div></div>
    <form className="surface flex flex-wrap items-end gap-3 p-4"><label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Bulan<div className="mt-2 h-10 w-56"><AdminMonthPicker name="month" defaultValue={monthStr} /></div></label><label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Jenis Transaksi<AppSelect name="type" defaultValue={type} className={`mt-2 w-56 ${input}`} options={[{ value: '', label: 'Semua transaksi' }, { value: 'penjualan', label: 'Penjualan saja' }, { value: 'pembelian', label: 'Pembelian saja' }]} /></label><button className="interactive h-10 rounded-xl bg-blue-600 px-4 text-xs font-medium text-white">Tampilkan laporan</button></form>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600">Total Pembelian</p>
        <p className="mt-2 text-2xl font-bold text-emerald-700">{currency(purchase)}</p>
      </div>
      <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-rose-600">Total Penjualan</p>
        <p className="mt-2 text-2xl font-bold text-rose-700">{currency(sales)}</p>
      </div>
      <div className="rounded-[16px] border border-blue-200 bg-blue-50 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-blue-600">Laba / Rugi</p>
        <p className="mt-2 text-2xl font-bold text-blue-700">{currency(sales - purchase)}</p>
      </div>
    </div>
    <div className="grid gap-6">
      <section className="surface overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><BarChart3 className="size-4 text-emerald-600" /><div><h2 className="text-sm font-semibold text-blue-950">Grafik penjualan</h2><p className="mt-1 text-[11px] text-slate-400">Perbandingan pemasukan dan pengeluaran harian</p></div></div><div className="flex items-center gap-4"><div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-500 mr-2"><span className="flex items-center gap-2"><i className="size-2.5 rounded-sm bg-emerald-500" /> Pengeluaran</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-sm bg-rose-500" /> Pemasukan</span></div></div></div><div className="p-5 sm:p-6"><div className="grid grid-cols-[44px_1fr] gap-3"><div className="flex h-72 flex-col justify-between pb-8 text-right text-[10px] text-slate-400"><span>{currency(max)}</span><span>{currency(max*.75)}</span><span>{currency(max*.5)}</span><span>{currency(max*.25)}</span><span>Rp 0</span></div><div className="relative h-72"><div className="pointer-events-none absolute inset-x-0 top-0 flex h-[calc(100%-32px)] flex-col justify-between">{Array.from({length:5},(_,index)=><span key={index} className="block border-t border-slate-100" />)}</div><div className="absolute inset-0 flex items-end gap-1.5 overflow-x-auto pb-8 px-1 scroll-smooth">{days.map((item)=><div key={item.label} className="group relative flex h-full min-w-[32px] flex-1 flex-col items-center justify-end hover:bg-slate-50/50 rounded-t-lg transition-colors"><div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden flex-col items-start justify-center rounded-md bg-slate-900 px-2.5 py-2 text-[10px] text-white shadow-md group-hover:flex whitespace-nowrap"><span className="font-semibold mb-1.5 text-slate-200">Tanggal {item.label}</span><div className="flex flex-col gap-1"><span className="text-emerald-400">Pengeluaran: {currency(item.cost)}</span><span className="text-rose-400">Pemasukan: {currency(item.value)}</span><span className={`mt-0.5 pt-1 border-t border-slate-700 font-medium ${item.value - item.cost >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>Laba/Rugi: {currency(item.value - item.cost)}</span></div></div><div className="flex w-full h-full items-end justify-center gap-[2px]"><div style={{height:`${Math.max(1,(item.cost/max)*100)}%`}} className="w-full max-w-[12px] rounded-t-[3px] bg-emerald-500 transition-all duration-300 group-hover:bg-emerald-600"></div><div style={{height:`${Math.max(1,(item.value/max)*100)}%`}} className="w-full max-w-[12px] rounded-t-[3px] bg-rose-500 transition-all duration-300 group-hover:bg-rose-600"></div></div><span className="mt-3 text-[10px] text-slate-400 group-hover:text-slate-600 font-medium">{item.label}</span></div>)}</div></div></div></div></section>
    </div>
    <div className="grid gap-6">
      <section className="surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-950">
          <Landmark className="size-4 text-blue-600" /> Ringkasan Laporan Bulanan
        </h2>
        <div className="mt-5 space-y-4">
          <div className="flex justify-between border-b border-blue-50 pb-4 text-sm">
            <span className="text-slate-500">Total Pembelian</span>
            <span className="font-semibold text-emerald-700">{currency(purchase)}</span>
          </div>
          <div className="flex justify-between border-b border-blue-50 pb-4 text-sm">
            <span className="text-slate-500">Total Penjualan</span>
            <span className="font-semibold text-rose-700">{currency(sales)}</span>
          </div>
          <div className="flex justify-between py-2 text-base font-bold">
            <span className="text-slate-700">Laba / Rugi</span>
            <span className={sales - purchase >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{currency(sales - purchase)}</span>
          </div>
        </div>
      </section>
    </div>
  </div>;
}
