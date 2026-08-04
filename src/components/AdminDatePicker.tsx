'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

interface AdminDatePickerProps {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
  onChange?: (date: string) => void;
}

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function parseDate(value?: string) {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

export default function AdminDatePicker({ name, defaultValue, required, className = '', ariaLabel = 'Pilih tanggal', onChange }: AdminDatePickerProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const initial = useMemo(() => parseDate(defaultValue), [defaultValue]);
  const [selected, setSelected] = useState(initial);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const positionPopover = useCallback(() => {
    const trigger = root.current?.querySelector<HTMLButtonElement>('.admin-date-trigger');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 7;
    const viewportPadding = 8;
    const width = Math.min(300, window.innerWidth - viewportPadding * 2);
    const estimatedHeight = 360;
    const below = rect.bottom + gap;
    const top = below + estimatedHeight <= window.innerHeight - viewportPadding
      ? below
      : Math.max(viewportPadding, rect.top - estimatedHeight - gap);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );
    setPopoverStyle({ position: 'fixed', top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    positionPopover();
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const reposition = () => positionPopover();
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, positionPopover]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const leading = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return day > 0 && day <= totalDays ? day : null;
  });
  const today = new Date();

  const selectDate = (day: number) => {
    const next = new Date(year, month, day);
    setSelected(next);
    onChange?.(toIso(next));
    setOpen(false);
  };

  const chooseToday = () => {
    const next = new Date();
    setSelected(next);
    onChange?.(toIso(next));
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setOpen(false);
  };

  const toggleCalendar = () => {
    if (!open) positionPopover();
    setOpen((value) => !value);
  };

  const calendar = open && createPortal(
    <div
      ref={popoverRef}
      id={id + '-calendar'}
      className="admin-date-popover"
      style={popoverStyle}
      role="dialog"
      aria-modal="false"
      aria-label={'Kalender ' + months[month] + ' ' + year}
    >
      <div className="admin-date-heading">
        <button type="button" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} aria-label="Bulan sebelumnya"><ChevronLeft /></button>
        <p>{months[month]} <span>{year}</span></p>
        <button type="button" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} aria-label="Bulan berikutnya"><ChevronRight /></button>
      </div>
      <div className="admin-date-weekdays" aria-hidden="true">
        {weekdays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="admin-date-grid">
        {cells.map((day, index) => {
          if (!day) return <span key={'empty-' + index} />;
          const currentDate = new Date(year, month, day);
          const isSelected = sameDay(currentDate, selected);
          const isToday = sameDay(currentDate, today);
          return (
            <button
              key={day}
              type="button"
              className={(isSelected ? 'is-selected ' : '') + (isToday ? 'is-today' : '')}
              onClick={() => selectDate(day)}
              aria-pressed={isSelected}
              aria-label={currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="admin-date-footer">
        <button type="button" onClick={chooseToday}>Hari ini</button>
      </div>
    </div>,
    document.body,
  );

  return (
    <div ref={root} className={'admin-date-picker ' + className}>
      <input id={id} type="hidden" name={name} value={toIso(selected)} required={required} />
      <button
        type="button"
        className="admin-date-trigger h-9 sm:h-11 px-2 sm:px-3"
        onClick={toggleCalendar}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={id + '-calendar'}
        aria-haspopup="dialog"
      >
        <CalendarDays className="size-3 sm:size-4" />
        <span className="!text-[9px] sm:!text-xs leading-tight">{selected.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <ChevronRight className={'admin-date-trigger-chevron size-3 sm:size-4 ' + (open ? 'is-open' : '')} />
      </button>
      {calendar}
    </div>
  );
}

