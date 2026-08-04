import AdminActionForm from '@/components/AdminActionForm';
import { ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createCashTransaction } from '@/app/actions/business';
import { currency, date } from '@/lib/format';
import AppSelect from '@/components/AppSelect';
import AdminDatePicker from '@/components/AdminDatePicker';
import CurrencyInput from '@/components/CurrencyInput';
import { DeleteCashBtn } from '@/components/FinanceDeleteButtons';
import CashTypeAndCategory from '@/components/CashTypeAndCategory';
import FinanceStatisticCards from '@/components/FinanceStatisticCards';
import FinanceChart from '@/components/FinanceChart';
import { buildFinanceStatistics } from '@/lib/finance-statistics';

export const dynamic = 'force-dynamic';

export default async function FinancePage(props: { searchParams: Promise<{ date?: string; period?: string }> }) {
  const searchParams = await props.searchParams;
  const defaultToday = new Date();
  const period = (searchParams.period || 'month') as 'day' | 'week' | 'month' | 'year';
  
  // Gunakan WIB offset (UTC+7)
  const WIB_OFFSET = 7 * 60 * 60 * 1000;
  
  // Hitung rentang tanggal berdasarkan searchParams.date atau hari ini
  let rangeEndDate: Date;
  let rangeStartDate: Date;
  
  if (searchParams.date) {
    // Filter tanggal spesifik: start = 00:00 WIB, end = 23:59 WIB
    const [y, m, d] = searchParams.date.split('-').map(Number);
    rangeStartDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - WIB_OFFSET);
    rangeEndDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - WIB_OFFSET);
  } else {
    // Filter berdasarkan period relatif dari hari ini
    const nowWib = new Date(defaultToday.getTime() + WIB_OFFSET);
    const y = nowWib.getUTCFullYear(), m = nowWib.getUTCMonth(), d = nowWib.getUTCDate();
    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
    const days = periodDays[period] || 1;
    
    rangeEndDate = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - WIB_OFFSET);
    rangeStartDate = new Date(Date.UTC(y, m, d - (days - 1), 0, 0, 0, 0) - WIB_OFFSET);
  }
  
  const today = rangeEndDate;
  // Fetch up to 5 years (1825 days) of history to support the 5-year chart filter
  const historyFrom = new Date(rangeEndDate.getTime() - 1825 * 24 * 60 * 60 * 1000);

  const [transactions, cashTotals, cashCategories, cashHistory, rawOrders, rawPurchases] = await Promise.all([
    prisma.cashTransaction.findMany({ orderBy: { date: 'desc' }, take: 100 }),
    prisma.cashTransaction.groupBy({ by: ['type'], _sum: { amount: true } }),
    prisma.cashCategory.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
    prisma.cashTransaction.findMany({ 
      where: { date: { gte: historyFrom } },
      select: { date: true, amount: true, type: true }
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: historyFrom } },
      select: { createdAt: true, totalAmount: true }
    }),
    prisma.purchase.findMany({
      where: { date: { gte: historyFrom } },
      select: { date: true, totalAmount: true }
    }),
  ]);

  // Remove unused date helpers
  const incoming = Number(cashTotals.find(r => r.type === 'MASUK')?._sum.amount || 0);
  const outgoing = Number(cashTotals.find(r => r.type === 'KELUAR')?._sum.amount || 0);
  const balance = incoming - outgoing;

  const statisticCards = buildFinanceStatistics(
    cashHistory.map(h => ({ date: h.date, amount: Number(h.amount), type: h.type as 'MASUK' | 'KELUAR' })),
    rawOrders.map(o => ({ date: o.createdAt, total: Number(o.totalAmount) })),
    rawPurchases.map(p => ({ date: p.date, total: Number(p.totalAmount) })),
    balance,
    today
  );

  // Rekap Penjualan dan Pembelian murni
  const rekapMasuk = rawOrders.filter(o => o.createdAt >= rangeStartDate && o.createdAt <= rangeEndDate).reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const rekapKeluar = rawPurchases.filter(p => p.date >= rangeStartDate && p.date <= rangeEndDate).reduce((sum, p) => sum + Number(p.totalAmount), 0);

  // Label rekap
  const periodLabel: Record<string, string> = { day: date(today), week: '7 hari terakhir', month: '30 hari terakhir', year: '12 bulan terakhir' };
  const rekapLabel = searchParams.date ? date(today) : periodLabel[period];

  const input = 'mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      {/* Header & Summary cards */}
      <FinanceStatisticCards 
        cards={statisticCards} 
        defaultDate={today.toISOString().slice(0, 10)}
        headerContent={
          <div>
            <p className="text-sm font-medium text-blue-600">Pembukuan</p>
            <h1 className="mt-1 text-2xl font-semibold text-blue-950">Kas & modal</h1>
          </div>
        }
      />

      {/* Area Chart */}
      <FinanceChart 
        data={cashHistory.map(h => ({ 
          date: h.date, 
          amount: Number(h.amount), 
          type: h.type as 'MASUK' | 'KELUAR' 
        }))} 
      />

      {/* Rekap Transaksi */}
      <section className="surface overflow-hidden">
        <div className="border-b border-blue-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-blue-950">Transaksi Penjualan & Pembelian {rekapLabel}</h2>
          </div>
          <ArrowDownLeft className="size-5 text-blue-400" />
        </div>
        <div className="grid gap-px bg-blue-100 sm:grid-cols-3">
          <div className="bg-white p-3 sm:p-5 flex items-center sm:items-start gap-3 sm:gap-4">
            <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-50">
              <ArrowDownLeft className="size-4 sm:size-5 text-emerald-600" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-500 truncate">Total Penjualan</p>
              <p className="mt-0.5 sm:mt-1.5 text-sm sm:text-xl font-semibold text-emerald-700 truncate">{currency(rekapMasuk)}</p>
              <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] text-slate-400 truncate">Kas masuk periode ini</p>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 flex items-center sm:items-start gap-3 sm:gap-4">
            <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-red-50">
              <ArrowUpRight className="size-4 sm:size-5 text-red-600" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-500 truncate">Total Pembelian</p>
              <p className="mt-0.5 sm:mt-1.5 text-sm sm:text-xl font-semibold text-red-700 truncate">{currency(rekapKeluar)}</p>
              <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] text-slate-400 truncate">Kas keluar periode ini</p>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-5 flex items-center sm:items-start gap-3 sm:gap-4">
            <span className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${rekapMasuk - rekapKeluar >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
              <Landmark className={`size-4 sm:size-5 ${rekapMasuk - rekapKeluar >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-500 truncate">Laba / Rugi</p>
              <p className={`mt-0.5 sm:mt-1.5 text-sm sm:text-xl font-semibold truncate ${rekapMasuk - rekapKeluar >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{currency(rekapMasuk - rekapKeluar)}</p>
              <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] text-slate-400 truncate">{rekapMasuk - rekapKeluar >= 0 ? 'Surplus' : 'Defisit'} periode ini</p>
            </div>
          </div>
        </div>
      </section>

      {/* Input forms */}
      <div className="grid gap-6">
        {/* Cash transaction form */}
        <AdminActionForm
          action={createCashTransaction}
          successMessage="Transaksi kas berhasil disimpan."
          resetOnSuccess
          className="surface grid gap-4 p-5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h2 className="text-sm font-semibold text-blue-950">Catat uang masuk atau keluar</h2>
          </div>
          <label className="text-xs font-medium text-slate-600">
            Tanggal
            <AdminDatePicker name="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="mt-2" />
          </label>
          <CashTypeAndCategory categories={cashCategories.map(c => ({ id: c.id, name: c.name, type: c.type as 'MASUK' | 'KELUAR' }))} />
          <label className="text-xs font-medium text-slate-600">
            Jumlah uang
            <CurrencyInput name="amount" required className={input} />
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-2">
            Keterangan
            <input name="description" className={input} placeholder="(opsional)" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="admin-data-action interactive rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">
              Simpan transaksi
            </button>
          </div>
        </AdminActionForm>
      </div>

      {/* Transaction lists */}
      <div className="grid gap-6">
        {/* Cash book */}
        <section className="surface overflow-hidden">
          <div className="border-b border-blue-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-blue-950">Transaksi</h2>
          </div>
          <div className="divide-y divide-blue-50">
            {transactions.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className={`flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg ${item.type === 'MASUK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'MASUK' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-950 truncate">{item.category}</p>
                    <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 truncate">{date(item.date)} — {item.description || item.referenceId || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <p className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${item.type === 'MASUK' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {item.type === 'MASUK' ? '+' : '-'}{currency(Number(item.amount))}
                  </p>
                  <DeleteCashBtn id={item.id} category={item.category} />
                </div>
              </div>
            ))}
            {!transactions.length && (
              <p className="p-10 text-center text-sm text-slate-400">Belum ada transaksi kas.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
