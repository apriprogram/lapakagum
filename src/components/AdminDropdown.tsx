'use client';

import { ChevronDown, Check } from 'lucide-react';
import { useEffect, useRef, useState, ReactNode } from 'react';

export interface AdminDropdownOption {
  value: string;
  label: string;
}

export interface AdminDropdownProps {
  options: AdminDropdownOption[];
  value?: string;
  onChange?: (val: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  className?: string;
}

export default function AdminDropdown({ 
  options, 
  value, 
  onChange, 
  icon, 
  placeholder = 'Pilih',
  className = ''
}: AdminDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="admin-date-trigger h-9 sm:h-11 px-2 sm:px-3 w-full"
      >
        {icon}
        <span className="flex-1 text-left !text-[9px] sm:!text-xs leading-tight">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`size-3 sm:size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div 
          className="admin-popover p-1.5 w-48 shadow-xl"
          style={{ top: 'calc(100% + 6px)' }}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left ${value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-950'}`}
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
