'use client';

import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Check, MoreVertical, TrendingUp, TrendingDown, Wallet, Landmark, ChevronDown } from 'lucide-react';
import { currency } from '@/lib/format';
import type { DashboardPeriod, DashboardStatisticPoint } from '@/lib/dashboard-statistics';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import AdminDatePicker from './AdminDatePicker';
import AdminDropdown from './AdminDropdown';

export type FinanceStatisticCard = {
  id: string;
  label: string;
  icon: 'income' | 'expense' | 'profit' | 'balance';
  tone: 'emerald' | 'red' | 'blue' | 'amber';
  periods?: Record<DashboardPeriod, DashboardStatisticPoint>;
  staticValue?: number;
  staticNote?: string;
};

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'day', label: 'Per hari' },
  { value: 'week', label: 'Per minggu' },
  { value: 'month', label: 'Per bulan' },
  { value: 'year', label: 'Per tahun' },
];

const periodSuffix: Record<DashboardPeriod, string> = { day: 'Hari', week: 'Minggu', month: 'Bulan', year: 'Tahun' };
const iconMap = {
  income: TrendingUp,
  expense: TrendingDown,
  profit: Landmark,
  balance: Wallet,
};

function formatChange(value: number) {
  const absolute = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(Math.abs(value));
  return value > 0 ? '+' + absolute + '%' : value < 0 ? '-' + absolute + '%' : '0%';
}

export default function FinanceStatisticCards({ 
  cards, 
  defaultDate,
  headerContent 
}: { 
  cards: FinanceStatisticCard[], 
  defaultDate: string,
  headerContent?: React.ReactNode 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentPeriod = (searchParams.get('period') as DashboardPeriod) || 'month';
  const currentDate = searchParams.get('date') || defaultDate;

  // Removed manual outside click logic as AdminDropdown handles it

  const updateFilters = (newPeriod: string | null, newDate: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    // If we pick a date, reset period to 'day'
    if (newDate !== null) {
      if (newDate && newDate !== defaultDate) params.set('date', newDate);
      else params.delete('date');
      params.delete('period'); // Picking date resets period
    }
    
    // If we pick a period, reset date
    if (newPeriod !== null) {
      if (newPeriod !== 'month') params.set('period', newPeriod);
      else params.delete('period');
      params.delete('date'); // Picking period resets date
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          {headerContent}
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
        {/* Date Filter */}
        <div className="relative w-full sm:w-auto">
          <AdminDatePicker 
            name="filterDate"
            defaultValue={currentDate}
            onChange={(val) => updateFilters(null, val)}
            className="w-full sm:w-44 text-xs sm:text-sm"
          />
        </div>

        {/* Global Period Filter */}
        <AdminDropdown
          className="w-full sm:w-44 text-xs sm:text-sm"
          icon={<CalendarIcon className="size-3 sm:size-4" />}
          options={periodOptions}
          value={searchParams.has('date') ? undefined : currentPeriod}
          placeholder="Periode"
          onChange={(val) => updateFilters(val, null)}
        />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
        {cards.map((card) => {
          const hasPeriods = Boolean(card.periods);
          const period = currentPeriod;
          const point = hasPeriods ? card.periods![period!] : null;
          const Icon = iconMap[card.icon];
          
          let changeValue = 0;
          let changeLabel = '';

          if (point) {
            changeValue = point.change;
            changeLabel = formatChange(point.change);
          }

          const toneStyles = {
            emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
            red: { bg: 'bg-red-50', icon: 'text-red-600', val: 'text-red-700' },
            blue: { bg: 'bg-blue-50', icon: 'text-blue-600', val: 'text-blue-700' },
            amber: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-700' },
          }[card.tone];

          return (
            <article key={card.id} className="bg-white rounded-xl p-3 sm:p-5 flex flex-col sm:flex-row items-start gap-2 sm:gap-4 ring-1 ring-transparent hover:ring-blue-500 transition-all cursor-default">
              <span className={`flex size-7 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${toneStyles.bg}`}>
                <Icon className={`size-3.5 sm:size-5 ${toneStyles.icon}`} />
              </span>
              <div className="min-w-0 flex flex-col gap-0.5 sm:gap-1 w-full">
                <span className="text-[9px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-500 truncate">{card.label}</span>
                {hasPeriods && point ? (
                  <>
                    <span className={`text-sm sm:text-xl font-bold ${toneStyles.val} truncate`}>
                      {currency(point.value)}
                    </span>
                    <span className="text-[8px] sm:text-[11px] text-slate-400 truncate">
                      {changeLabel} dibanding {periodSuffix[period!].toLowerCase()} lalu
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-sm sm:text-xl font-bold ${toneStyles.val} truncate`}>
                      {currency(card.staticValue || 0)}
                    </span>
                    <span className="text-[8px] sm:text-[11px] text-slate-400 truncate">
                      {card.staticNote}
                    </span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
