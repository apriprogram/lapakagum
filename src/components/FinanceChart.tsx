'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { currency } from '@/lib/format';

export type ChartDataPoint = {
  date: Date;
  amount: number;
  type: 'MASUK' | 'KELUAR';
};

interface FinanceChartProps {
  data: ChartDataPoint[];
}

type PeriodFilter = 'day' | 'week' | 'month' | 'year';

export default function FinanceChart({ data }: FinanceChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>('month');

  const chartData = useMemo(() => {
    // We group the data based on the selected period
    // We will get the last N units of time to show
    const now = new Date();
    // Offset for WIB (UTC+7)
    const WIB_OFFSET = 7 * 60 * 60 * 1000;
    const todayWib = new Date(now.getTime() + WIB_OFFSET);

    const grouped = new Map<string, { income: number; expense: number; label: string; fullLabel: string }>();
    
    // Determine how many points to show and how to center the current period
    let points = 7;
    let offsetShift = 0;
    if (period === 'day') { points = 14; offsetShift = 7; }
    if (period === 'week') { points = 12; offsetShift = 6; }
    if (period === 'month') { points = 12; offsetShift = 6; }
    if (period === 'year') { points = 5; offsetShift = 0; }

    // Generate buckets backwards
    for (let i = points - 1; i >= 0; i--) {
      let key = '';
      let label = '';
      let fullLabel = '';
      const d = new Date(todayWib);
      const shift = offsetShift - i;

      if (period === 'day') {
        d.setUTCDate(d.getUTCDate() + shift);
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        label = d.getUTCDate() + ' ' + d.toLocaleDateString('id-ID', { month: 'short' });
        fullLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      } else if (period === 'week') {
        d.setUTCDate(d.getUTCDate() + (shift * 7));
        // Find monday of this week
        const day = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() - day + 1);
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        label = d.getUTCDate() + ' ' + d.toLocaleDateString('id-ID', { month: 'short' });
        
        const endOfWeek = new Date(d);
        endOfWeek.setUTCDate(d.getUTCDate() + 6);
        fullLabel = `${d.getUTCDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })} - ${endOfWeek.getUTCDate()} ${endOfWeek.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
      } else if (period === 'month') {
        d.setUTCMonth(d.getUTCMonth() + shift);
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        label = d.toLocaleDateString('id-ID', { month: 'short' });
        fullLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      } else if (period === 'year') {
        // Start from 2026 as requested by user
        const baseYear = 2026;
        // Since i goes from (points-1) down to 0, (points - 1 - i) goes from 0 to (points-1)
        d.setUTCFullYear(baseYear + (points - 1 - i));
        key = `${d.getUTCFullYear()}`;
        label = `${d.getUTCFullYear()}`;
        fullLabel = `Tahun ${d.getUTCFullYear()}`;
      }

      grouped.set(key, { income: 0, expense: 0, label, fullLabel });
    }

    // Assign data to buckets
    for (const item of data) {
      const itemDate = new Date(item.date.getTime() + WIB_OFFSET);
      let key = '';
      if (period === 'day') {
        key = `${itemDate.getUTCFullYear()}-${itemDate.getUTCMonth()}-${itemDate.getUTCDate()}`;
      } else if (period === 'week') {
        const d = new Date(itemDate);
        const day = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() - day + 1);
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      } else if (period === 'month') {
        key = `${itemDate.getUTCFullYear()}-${itemDate.getUTCMonth()}`;
      } else if (period === 'year') {
        key = `${itemDate.getUTCFullYear()}`;
      }

      if (grouped.has(key)) {
        const bucket = grouped.get(key)!;
        if (item.type === 'MASUK') {
          bucket.income += item.amount;
        } else {
          bucket.expense += item.amount;
        }
      }
    }

    return Array.from(grouped.values());
  }, [data, period]);

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}Jt`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
    return `Rp ${value}`;
  };

  return (
    <section className="surface overflow-hidden min-w-0">
      <div className="border-b border-blue-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-center relative min-h-[72px]">
        <div className="sm:absolute sm:left-5 sm:top-1/2 sm:-translate-y-1/2 mb-4 sm:mb-0">
          <h2 className="text-sm font-semibold text-blue-950">Statistik Kas</h2>
          <div className="mt-1.5 flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-emerald-500"></span>
              <span>Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-red-500"></span>
              <span>Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Local Filter Group */}
        <div className="rounded-full border border-blue-100 bg-slate-50/80 p-1 shadow-none w-full sm:w-auto overflow-hidden">
          <div className="relative grid grid-cols-4 w-full sm:w-[320px] min-w-0 z-0">
            <div 
              className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-blue-600 transition-transform duration-300 ease-out z-0"
              style={{ transform: `translateX(${['day', 'week', 'month', 'year'].indexOf(period) * 100}%)` }}
            />
            {[
              { id: 'day', label: 'Hari' },
              { id: 'week', label: 'Minggu' },
              { id: 'month', label: 'Bulan' },
              { id: 'year', label: 'Tahun' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPeriod(f.id as PeriodFilter)}
                className={`relative z-10 rounded-full py-2 text-[10px] sm:text-xs font-medium transition-colors duration-300 min-w-0 truncate px-1 ${
                  period === f.id
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="h-[250px] sm:h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                tickFormatter={formatYAxis}
                width={70}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-blue-100 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                        <p className="mb-2 text-[10px] font-bold text-slate-600">{data.fullLabel}</p>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="size-2 rounded-sm bg-emerald-500"></span>
                              <span className="text-[11px] font-medium text-slate-500">Pemasukan</span>
                            </div>
                            <span className="ml-auto text-[11px] font-bold text-slate-700">
                              {currency(data.income)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="size-2 rounded-sm bg-red-500"></span>
                              <span className="text-[11px] font-medium text-slate-500">Pengeluaran</span>
                            </div>
                            <span className="ml-auto text-[11px] font-bold text-slate-700">
                              {currency(data.expense)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
                activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
