'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface AppComboboxOption {
  value: string;
  label: string;
}

interface AppComboboxProps {
  name: string;
  options: AppComboboxOption[];
  defaultValue?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function AppCombobox({
  name,
  options,
  defaultValue = '',
  required = false,
  className = '',
  placeholder = 'Ketik atau pilih opsi',
}: AppComboboxProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(internalValue.toLowerCase()) || 
    option.value.toLowerCase().includes(internalValue.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={internalValue}
          required={required}
          className={className}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setInternalValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          onClick={() => {
            setOpen(!open);
            if (!open) inputRef.current?.focus();
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-blue-100 bg-white p-1 text-sm shadow-xl outline-none animate-in fade-in zoom-in-95">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-slate-500">
              {internalValue ? 'Tekan enter/simpan untuk menggunakan nama ini.' : 'Tidak ada opsi tersedia.'}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-slate-700 transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                onClick={() => {
                  setInternalValue(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
