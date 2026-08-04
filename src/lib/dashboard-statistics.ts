export type DashboardPeriod = 'day' | 'week' | 'month' | 'year';

export type DashboardStatisticPoint = {
  value: number;
  change: number;
  series: number[];
  note: string;
};

export type DashboardStatisticCard = {
  id: 'sales' | 'purchases' | 'profit' | 'debt';
  label: string;
  icon: 'shopping' | 'package' | 'trend' | 'truck';
  tone: 'blue' | 'cyan' | 'emerald' | 'amber';
  periods: Record<DashboardPeriod, DashboardStatisticPoint>;
};

type SaleEvent = { date: Date; sales: number; profit: number };
type PurchaseEvent = { date: Date; total: number; outstanding: number };
type ExpenseEvent = { date: Date; amount: number };
type DebtEvent = { date: Date; amount: number; paid: number };

type StatisticSource = {
  now: Date;
  sales: SaleEvent[];
  purchases: PurchaseEvent[];
  expenses: ExpenseEvent[];
  debts: DebtEvent[];
};

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

function metricValue(
  metric: DashboardStatisticCard['id'],
  source: StatisticSource,
  start: Date,
  end: Date,
) {
  if (metric === 'sales') {
    return source.sales.filter((item) => inRange(item.date, start, end)).reduce((sum, item) => sum + item.sales, 0);
  }
  if (metric === 'purchases') {
    return source.purchases.filter((item) => inRange(item.date, start, end)).reduce((sum, item) => sum + item.total, 0);
  }
  if (metric === 'profit') {
    const totalSales = source.sales.filter((item) => inRange(item.date, start, end)).reduce((sum, item) => sum + item.sales, 0);
    const totalPurchases = source.purchases.filter((item) => inRange(item.date, start, end)).reduce((sum, item) => sum + item.total, 0);
    return totalSales - totalPurchases;
  }
  return source.debts.filter((item) => inRange(item.date, start, end)).reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
}

function seriesFor(metric: DashboardStatisticCard['id'], source: StatisticSource, start: Date, end: Date, points: number) {
  const interval = Math.max(1, (end.getTime() - start.getTime()) / points);
  return Array.from({ length: points }, (_, index) => {
    const bucketStart = new Date(start.getTime() + interval * index);
    const bucketEnd = index === points - 1 ? end : new Date(start.getTime() + interval * (index + 1) - 1);
    return metricValue(metric, source, bucketStart, bucketEnd);
  });
}

function countFor(metric: DashboardStatisticCard['id'], source: StatisticSource, start: Date, end: Date) {
  if (metric === 'sales' || metric === 'profit') return source.sales.filter((item) => inRange(item.date, start, end)).length;
  if (metric === 'debt') return source.debts.filter((item) => inRange(item.date, start, end)).length;
  return source.purchases.filter((item) => inRange(item.date, start, end)).length;
}

function noteFor(metric: DashboardStatisticCard['id'], count: number, periodLabel: string) {
  if (metric === 'sales') return `${count} pesanan selesai ${periodLabel}`;
  if (metric === 'purchases') return `${count} pembelian tercatat ${periodLabel}`;
  if (metric === 'profit') return `Selisih penjualan & pembelian ${periodLabel}`;
  return `Penambahan hutang baru ${periodLabel}`;
}

function periodsFor(metric: DashboardStatisticCard['id'], source: StatisticSource) {
  return (Object.keys(periodConfig) as DashboardPeriod[]).reduce((result, period) => {
    const range = getRange(source.now, period);
    const value = metricValue(metric, source, range.currentStart, range.currentEnd);
    const previous = metricValue(metric, source, range.previousStart, range.previousEnd);
    result[period] = {
      value,
      change: percentageChange(value, previous),
      series: seriesFor(metric, source, range.currentStart, range.currentEnd, range.points),
      note: noteFor(metric, countFor(metric, source, range.currentStart, range.currentEnd), range.label),
    };
    return result;
  }, {} as Record<DashboardPeriod, DashboardStatisticPoint>);
}

export function buildDashboardStatistics(source: StatisticSource): DashboardStatisticCard[] {
  return [
    { id: 'sales', label: 'Penjualan', icon: 'shopping', tone: 'blue', periods: periodsFor('sales', source) },
    { id: 'purchases', label: 'Pembelian', icon: 'package', tone: 'cyan', periods: periodsFor('purchases', source) },
    { id: 'profit', label: 'Laba / Rugi', icon: 'trend', tone: 'emerald', periods: periodsFor('profit', source) },
    { id: 'debt', label: 'Total sisa hutang', icon: 'truck', tone: 'amber', periods: periodsFor('debt', source) },
  ];
}
