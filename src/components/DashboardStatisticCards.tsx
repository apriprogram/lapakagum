'use client';

import { useEffect, useState } from 'react';
import { Check, MoreVertical, PackagePlus, ShoppingBag, TrendingUp, Truck } from 'lucide-react';
import { currency } from '@/lib/format';
import type { DashboardPeriod, DashboardStatisticCard } from '@/lib/dashboard-statistics';

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'day', label: 'Per hari' },
  { value: 'week', label: 'Per minggu' },
  { value: 'month', label: 'Per bulan' },
  { value: 'year', label: 'Per tahun' },
];

const periodSuffix: Record<DashboardPeriod, string> = { day: 'Hari', week: 'Minggu', month: 'Bulan', year: 'Tahun' };
const iconMap = {
  shopping: ShoppingBag,
  package: PackagePlus,
  trend: TrendingUp,
  truck: Truck,
};


function formatChange(value: number) {
  const absolute = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(Math.abs(value));
  return value > 0 ? '+' + absolute + '%' : value < 0 ? '-' + absolute + '%' : '0%';
}


export default function DashboardStatisticCards({ cards }: { cards: DashboardStatisticCard[] }) {
  const [periods, setPeriods] = useState<Record<string, DashboardPeriod>>(
    () => Object.fromEntries(cards.map((card) => [card.id, 'day'])),
  );
  const [openCard, setOpenCard] = useState<string | null>(null);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (!(event.target as Element).closest('.admin-stat-menu-wrap')) setOpenCard(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenCard(null);
    };
    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="admin-stat-grid">
      {cards.map((card) => {
        const period = periods[card.id] || 'day';
        const point = card.periods[period];
        const Icon = iconMap[card.icon];
        const progress = Math.min(100, Math.abs(point.change));
        const circumference = 138.23;
        const ringLabel = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.min(999, Math.abs(point.change))) + '%';
        const dashOffset = circumference - (progress / 100) * circumference;

        return (
          <article key={card.id} className={'surface admin-stat-card admin-stat-' + card.tone}>
            <div className="admin-stat-head">
              <div className="admin-stat-label"><Icon /><p>{card.label}</p></div>
              <div className="admin-stat-menu-wrap">
                <button
                  type="button"
                  className="admin-stat-menu-trigger"
                  aria-label={'Pilih periode statistik ' + card.label}
                  aria-expanded={openCard === card.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenCard((current) => current === card.id ? null : card.id);
                  }}
                >
                  <MoreVertical />
                </button>
                {openCard === card.id && (
                  <div className="admin-stat-period-menu" onClick={(event) => event.stopPropagation()}>
                    {periodOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={period === option.value ? 'is-active' : ''}
                        onClick={() => {
                          setPeriods((current) => ({ ...current, [card.id]: option.value }));
                          setOpenCard(null);
                        }}
                      >
                        <span>{option.label}</span>
                        {period === option.value && <Check />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-stat-value-row">
              <div>
                <p className="admin-stat-value">{currency(point.value)} <span>/{periodSuffix[period]}</span></p>
                <p className="admin-stat-note">{point.note}</p>
                <p className={'admin-stat-comparison ' + (point.change < 0 ? 'is-negative' : 'is-positive')}>{formatChange(point.change)} dari periode lalu</p>
              </div>
              <div className="admin-stat-progress" aria-label={'Perubahan ' + formatChange(point.change) + ' dibanding periode sebelumnya'}>
                <svg viewBox="0 0 52 52" aria-hidden="true">
                  <circle className="admin-stat-progress-track" cx="26" cy="26" r="22" />
                  <circle
                    className="admin-stat-progress-value"
                    cx="26"
                    cy="26"
                    r="22"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <strong>{ringLabel}</strong>
              </div>
            </div>

          </article>
        );
      })}
    </div>
  );
}
