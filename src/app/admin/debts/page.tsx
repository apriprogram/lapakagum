import { CheckCircle2, CircleDollarSign, ReceiptText, Trash2, Truck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { currency, date } from '@/lib/format';
import { createStandaloneDebt, deleteStandaloneDebt, recordStandaloneDebtPayment } from '@/app/actions/debt';
import AdminActionForm from '@/components/AdminActionForm';
import AdminDataTable from '@/components/AdminDataTable';
import AdminDatePicker from '@/components/AdminDatePicker';
import AppSelect from '@/components/AppSelect';
import CurrencyInput from '@/components/CurrencyInput';
import DebtRowActions from '@/components/DebtRowActions';
import CancelDebtPaymentButton from '@/components/CancelDebtPaymentButton';

export const dynamic = 'force-dynamic';

export default async function DebtsPage() {
  const [vendors, debts, payments] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, isActive: true } }),
    prisma.standaloneDebt.findMany({ include: { vendor: true }, orderBy: { debtDate: 'desc' } }),
    prisma.standaloneDebtPayment.findMany({
      include: { debt: { include: { vendor: true } } },
      orderBy: { date: 'desc' },
      take: 12,
    }),
  ]);
  const totalDebt = debts.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalPaid = debts.reduce((sum, item) => sum + Number(item.paidAmount), 0);
  const remaining = totalDebt - totalPaid;
  const input = 'mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500';

  return <div className="space-y-6">
    <div>
      <p className="text-sm font-medium text-blue-600">Keuangan</p>
      <h1 className="mt-1 text-2xl font-semibold text-blue-950">Hutang mandiri</h1>
    </div>

    <div className="grid gap-2 sm:gap-4 sm:grid-cols-3">
      {[
        [CircleDollarSign, 'Total hutang', totalDebt, 'bg-blue-50 text-blue-600'],
        [CheckCircle2, 'Sudah dibayar', totalPaid, 'bg-emerald-50 text-emerald-600'],
        [ReceiptText, 'Sisa hutang', remaining, 'bg-amber-50 text-amber-600'],
      ].map(([Icon, label, value, tone]) => { 
        const ItemIcon = Icon as typeof CircleDollarSign; 
        return (
          <article key={String(label)} className="surface p-3 sm:p-5 flex items-center sm:block gap-3 sm:gap-0">
            <span className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${tone}`}>
              <ItemIcon className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <p className="sm:mt-4 text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide sm:tracking-normal sm:uppercase-none sm:capitalize">{String(label)}</p>
              <p className="mt-0.5 sm:mt-2 text-sm sm:text-xl font-semibold text-blue-950 truncate">{currency(Number(value))}</p>
            </div>
          </article>
        ); 
      })}
    </div>

    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <AdminActionForm action={createStandaloneDebt} successMessage="Hutang berhasil ditambahkan." resetOnSuccess className="surface grid gap-3 sm:gap-4 p-4 sm:p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><h2 className="text-sm font-semibold text-blue-950">Tambah hutang</h2></div>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">Pemasok<AppSelect name="vendorId" required className={input} options={[{ value: '', label: 'Pilih pemasok' }, ...vendors.map((item) => ({ value: String(item.id), label: `${item.name}${item.isActive ? '' : ' (nonaktif)'}` }))]} /></label>
        <label className="text-xs font-medium text-slate-600">Tanggal hutang<AdminDatePicker name="debtDate" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-2" /></label>
        <label className="text-xs font-medium text-slate-600">Nominal<CurrencyInput name="amount" required className={input} /></label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">Catatan<textarea name="notes" rows={3} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
        <div className="sm:col-span-2"><button className="admin-data-action interactive inline-flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><CircleDollarSign className="size-4" /> Simpan hutang</button></div>
      </AdminActionForm>

      <section className="surface overflow-hidden">
        <div className="border-b border-blue-100 px-4 sm:px-5 py-3 sm:py-4"><h2 className="text-sm font-semibold text-blue-950">Pembayaran terbaru</h2><p className="mt-1 text-[10px] sm:text-xs text-slate-400">Riwayat pembayaran khusus hutang mandiri.</p></div>
        <div className="divide-y divide-blue-50">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-950 truncate">{payment.debt.vendor.name}</p>
                  <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 truncate">{date(payment.date)} · {payment.notes || 'Pembayaran hutang'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <p className="text-xs sm:text-sm font-semibold text-emerald-700 whitespace-nowrap">{currency(Number(payment.amount))}</p>
                <CancelDebtPaymentButton id={payment.id} vendorName={payment.debt.vendor.name} amount={Number(payment.amount)} />
              </div>
            </div>
          ))}
          {!payments.length && <p className="p-10 text-center text-xs sm:text-sm text-slate-400">Belum ada pembayaran hutang.</p>}
        </div>
      </section>
    </div>

    <section className="surface overflow-hidden">
      <div className="border-b border-blue-100 px-5 py-4"><h2 className="text-sm font-semibold text-blue-950">Daftar hutang</h2></div>

      {/* Mobile card view */}
      <div className="block sm:hidden divide-y divide-blue-50">
        {debts.map((item) => {
          const balance = Math.max(0, Number(item.amount) - Number(item.paidAmount));
          const paid = balance <= 0.01;
          return (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-blue-500 shrink-0" />
                  <p className="font-semibold text-sm text-blue-950">{item.vendor.name}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {paid ? <CheckCircle2 className="size-3" /> : <ReceiptText className="size-3" />}
                  {paid ? 'Lunas' : 'Belum lunas'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide">Total</p>
                  <p className="font-semibold text-blue-950 mt-0.5">{currency(Number(item.amount))}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide">Terbayar</p>
                  <p className="font-semibold text-emerald-700 mt-0.5">{currency(Number(item.paidAmount))}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide">Sisa</p>
                  <p className="font-semibold text-amber-700 mt-0.5">{currency(balance)}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">{date(item.debtDate)}</p>
              {!paid && (
                <AdminActionForm action={recordStandaloneDebtPayment.bind(null, item.id)} successMessage="Pembayaran berhasil dicatat." resetOnSuccess className="flex flex-col gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <p className="text-[11px] font-medium text-slate-600">Catat pembayaran</p>
                  <AdminDatePicker name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="h-9 w-full text-xs rounded-lg px-2 border border-blue-100 bg-white" />
                  <div className="flex gap-2">
                    <CurrencyInput name="amount" required className="h-9 flex-1 rounded-lg border border-blue-100 bg-white px-2 text-xs outline-none focus:border-blue-500" placeholder="0" />
                    <button className="admin-data-action interactive h-9 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white">Bayar</button>
                  </div>
                </AdminActionForm>
              )}
              <div className="flex justify-end">
                <DebtRowActions id={item.id} vendorName={item.vendor.name} />
              </div>
            </div>
          );
        })}
        {!debts.length && <p className="p-10 text-center text-sm text-slate-400">Belum ada hutang mandiri.</p>}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <AdminDataTable title="Daftar hutang mandiri">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">No.</th><th className="px-5 py-3">Pemasok</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Terbayar</th><th className="px-5 py-3">Sisa</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Catat pembayaran</th><th className="px-5 py-3">Aksi</th></tr></thead>
            <tbody className="divide-y divide-blue-50">{debts.map((item) => { const balance = Math.max(0, Number(item.amount) - Number(item.paidAmount)); const paid = balance <= 0.01; return <tr key={item.id} data-table-row className="hover:bg-blue-50/30"><td data-row-number className="px-4 py-4" /><td className="px-5 py-4"><div className="flex items-center gap-2"><Truck className="size-4 text-blue-500" /><p className="font-medium text-blue-950">{item.vendor.name}</p></div></td><td className="px-5 py-4 text-xs text-slate-500">{date(item.debtDate)}</td><td className="px-5 py-4 font-medium text-blue-950">{currency(Number(item.amount))}</td><td className="px-5 py-4 text-emerald-700">{currency(Number(item.paidAmount))}</td><td className="px-5 py-4 font-semibold text-amber-700">{currency(balance)}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{paid ? <CheckCircle2 className="size-3" /> : <ReceiptText className="size-3" />}{paid ? 'Lunas' : 'Belum lunas'}</span></td><td className="px-5 py-4 align-top">{paid ? <span className="text-xs text-slate-400">Selesai</span> : <AdminActionForm action={recordStandaloneDebtPayment.bind(null, item.id)} successMessage="Pembayaran berhasil dicatat." resetOnSuccess className="flex flex-col gap-2 min-w-[200px] bg-white p-2 rounded-xl border border-blue-100 shadow-sm"><AdminDatePicker name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full" /><div className="flex flex-col gap-2"><CurrencyInput name="amount" required className="h-8 w-full rounded-lg border border-blue-100 px-2 text-[11px] outline-none focus:border-blue-500" placeholder="0" /><button className="admin-data-action interactive h-8 w-full rounded-lg bg-blue-600 px-3 text-[11px] font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">Bayar</button></div></AdminActionForm>}</td><td className="px-5 py-4 align-top"><DebtRowActions id={item.id} vendorName={item.vendor.name} /></td></tr>; })}{!debts.length && <tr data-table-row><td colSpan={9} className="px-5 py-12 text-center text-slate-400">Belum ada hutang mandiri.</td></tr>}</tbody>
          </table>
        </AdminDataTable>
      </div>
    </section>
  </div>;
}
