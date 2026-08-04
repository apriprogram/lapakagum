import type { DashboardPeriod, DashboardStatisticPoint } from './dashboard-statistics';
import type { FinanceStatisticCard } from '@/components/FinanceStatisticCards';

type CashTransactionEvent = { date: Date; amount: number; type: 'MASUK' | 'KELUAR' };

const periodConfig: Record<DashboardPeriod, { days: number; points: number; label: string }> = {
  day: { days: 1, points: 8, label: 'hari ini' },
  week: { days: 7, points: 7, label: '7 hari terakhir' },
  month: { days: 30, points: 6, label: '30 hari terakhir' },
  year: { days: 365, points: 12, label: '12 bulan terakhir' },
};

function getRange(now: Date, period: DashboardPeriod) {
  const config = periodConfig[period];
  const currentStart = new Date(now);
  currentStart.setHours(0, 0, 0, 0);
  currentStart.setDate(currentStart.getDate() - (config.days - 1));
  const duration = Math.max(1, now.getTime() - currentStart.getTime());
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return { currentStart, currentEnd: now, previousStart, previousEnd, ...config };
}

function inRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

function metricValue(metric: 'income' | 'expense' | 'profit', transactions: CashTransactionEvent[], sales: {date: Date, total: number}[], purchases: {date: Date, total: number}[], start: Date, end: Date) {
  if (metric === 'income') {
    return transactions.filter(t => t.type === 'MASUK' && inRange(t.date, start, end)).reduce((sum, t) => sum + t.amount, 0);
  }
  if (metric === 'expense') {
    return transactions.filter(t => t.type === 'KELUAR' && inRange(t.date, start, end)).reduce((sum, t) => sum + t.amount, 0);
  }
  // profit: Sales - Purchases
  const s = sales.filter(t => inRange(t.date, start, end)).reduce((sum, t) => sum + t.total, 0);
  const p = purchases.filter(t => inRange(t.date, start, end)).reduce((sum, t) => sum + t.total, 0);
  return s - p;
}

function seriesFor(metric: 'income' | 'expense' | 'profit', transactions: CashTransactionEvent[], sales: {date: Date, total: number}[], purchases: {date: Date, total: number}[], start: Date, end: Date, points: number) {
  const interval = Math.max(1, (end.getTime() - start.getTime()) / points);
  return Array.from({ length: points }, (_, index) => {
    const bucketStart = new Date(start.getTime() + interval * index);
    const bucketEnd = index === points - 1 ? end : new Date(start.getTime() + interval * (index + 1) - 1);
    return metricValue(metric, transactions, sales, purchases, bucketStart, bucketEnd);
  });
}

function countFor(metric: 'income' | 'expense', transactions: CashTransactionEvent[], start: Date, end: Date) {
  const type = metric === 'income' ? 'MASUK' : 'KELUAR';
  return transactions.filter(t => t.type === type && inRange(t.date, start, end)).length;
}

function periodsFor(metric: 'income' | 'expense' | 'profit', transactions: CashTransactionEvent[], sales: {date: Date, total: number}[], purchases: {date: Date, total: number}[], now: Date) {
  return (Object.keys(periodConfig) as DashboardPeriod[]).reduce((result, period) => {
    const range = getRange(now, period);
    const value = metricValue(metric, transactions, sales, purchases, range.currentStart, range.currentEnd);
    const previous = metricValue(metric, transactions, sales, purchases, range.previousStart, range.previousEnd);
    
    let note = '';
    if (metric === 'income') note = `${countFor('income', transactions, range.currentStart, range.currentEnd)} trx masuk`;
    else if (metric === 'expense') note = `${countFor('expense', transactions, range.currentStart, range.currentEnd)} trx keluar`;
    else note = `Selisih penjualan & pembelian`;

    result[period] = {
      value,
      change: percentageChange(value, previous),
      series: seriesFor(metric, transactions, sales, purchases, range.currentStart, range.currentEnd, range.points),
      note,
    };
    return result;
  }, {} as Record<DashboardPeriod, DashboardStatisticPoint>);
}

export function buildFinanceStatistics(transactions: CashTransactionEvent[], sales: {date: Date, total: number}[], purchases: {date: Date, total: number}[], balance: number, now = new Date()): FinanceStatisticCard[] {
  return [
    { id: 'income', label: 'Pemasukan', icon: 'income', tone: 'emerald', periods: periodsFor('income', transactions, sales, purchases, now) },
    { id: 'expense', label: 'Pengeluaran', icon: 'expense', tone: 'red', periods: periodsFor('expense', transactions, sales, purchases, now) },
    { id: 'balance', label: 'Saldo Kas Saat Ini', icon: 'balance', tone: 'blue', staticValue: balance, staticNote: 'Posisi kas akhir' },
  ];
}
