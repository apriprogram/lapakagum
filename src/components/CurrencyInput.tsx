'use client';

import { useEffect, useRef, useState } from 'react';

type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'inputMode'> & {
  name: string;
  value?: number;
  defaultValue?: number | string;
  onValueChange?: (value: number) => void;
};

const rupiahNumber = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

function numericValue(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export default function CurrencyInput({ name, value, defaultValue, onValueChange, placeholder = 'Rp 0', ...props }: CurrencyInputProps) {
  const initial = numericValue(defaultValue);
  const [internalValue, setInternalValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const amount = controlled ? numericValue(value) : internalValue;
  const displayValue = amount > 0 ? rupiahNumber.format(amount) : '';

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || controlled) return;
    const reset = () => setInternalValue(initial);
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [controlled, initial]);

  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    const nextValue = numericValue(digits);
    if (!controlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };
  const { className, ...restProps } = props;
  const wrapperClass = className?.replace(/focus:/g, 'focus-within:') || '';

  return (
    <>
      <style>{`
        .admin-content .currency-input-wrapper {
          background-color: #fff;
        }
        .admin-dark .admin-content .currency-input-wrapper {
          background-color: #181816 !important;
        }
        .admin-content .currency-input-inner {
          background-color: transparent !important;
        }
        .admin-content .currency-input-inner:focus {
          outline: none !important;
          border-color: transparent !important;
          box-shadow: none !important;
          background-color: transparent !important;
        }
        .admin-content .currency-input-wrapper:focus-within {
          border-color: #246bfd !important;
          outline: 3px solid rgba(36,107,253,.12) !important;
          outline-offset: 0;
        }
      `}</style>
      <div 
        className={`flex items-center currency-input-wrapper ${wrapperClass}`} 
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-slate-500 select-none mr-1.5 shrink-0 pointer-events-none">Rp</span>
        <input 
          {...restProps} 
          ref={inputRef} 
          type="text" 
          inputMode="numeric" 
          autoComplete="off" 
          value={displayValue} 
          onChange={change} 
          placeholder={placeholder === 'Rp 0' ? '0' : placeholder} 
          className="currency-input-inner w-full p-0 m-0 min-w-0 text-[inherit]" 
        />
      </div>
      <input type="hidden" name={name} value={amount || ''} />
    </>
  );
}
