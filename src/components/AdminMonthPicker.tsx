'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

interface AdminMonthPickerProps {
  name?: string;
  defaultValue?: string; // Format: YYYY-MM
  className?: string;
  onChange?: (value: string) => void;
}

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function AdminMonthPicker({ name, defaultValue, className = '', onChange }: AdminMonthPickerProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const initial = useMemo(() => {
    if (!defaultValue) return new Date();
    const [year, month] = defaultValue.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [defaultValue]);

  const [selected, setSelected] = useState(initial);
  const [visibleYear, setVisibleYear] = useState(initial.getFullYear());
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const positionPopover = useCallback(() => {
    const trigger = root.current?.querySelector<HTMLButtonElement>('.admin-month-trigger');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 280;
    const estimatedHeight = 240;
    const top = rect.bottom + 8 + estimatedHeight <= window.innerHeight
      ? rect.bottom + 8
      : Math.max(8, rect.top - estimatedHeight - 8);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
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
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', positionPopover);
    window.addEventListener('scroll', positionPopover, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', positionPopover);
      window.removeEventListener('scroll', positionPopover, true);
    };
  }, [open, positionPopover]);

  const valueStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}`;
  const label = `${months[selected.getMonth()]} ${selected.getFullYear()}`;

  return (
    <div className={`relative ${className}`} ref={root}>
      {name && <input type="hidden" name={name} value={valueStr} />}
      <button
        type="button"
        id={id}
        className="admin-month-trigger flex h-full w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none"
        onClick={() => {
          setVisibleYear(selected.getFullYear());
          setOpen((o) => !o);
        }}
      >
        <span className="truncate">{label}</span>
        <Calendar className="size-4 shrink-0 text-slate-400" />
      </button>

      {open && createPortal(
        <div ref={popoverRef} style={popoverStyle} className="z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              className="interactive flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setVisibleYear((y) => y - 1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700">{visibleYear}</span>
            <button
              type="button"
              className="interactive flex size-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setVisibleYear((y) => y + 1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => {
              const isSelected = selected.getFullYear() === visibleYear && selected.getMonth() === i;
              const isCurrent = new Date().getFullYear() === visibleYear && new Date().getMonth() === i;
              return (
                <button
                  key={m}
                  type="button"
                  className={`mx-auto flex size-12 items-center justify-center rounded-full text-xs font-medium ${isSelected ? 'bg-blue-600 text-white' : isCurrent ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => {
                    const newDate = new Date(visibleYear, i, 1);
                    setSelected(newDate);
                    setOpen(false);
                    onChange?.(`${visibleYear}-${String(i + 1).padStart(2, '0')}`);
                  }}
                >
                  {m.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
