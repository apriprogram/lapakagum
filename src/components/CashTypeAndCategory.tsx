'use client';

import { useState } from 'react';
import AppSelect from '@/components/AppSelect';
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';

type CashCategoryOption = { id: number; name: string; type: 'MASUK' | 'KELUAR' };

const inputCls = 'mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500';

export default function CashTypeAndCategory({ categories }: { categories: CashCategoryOption[] }) {
  const [type, setType] = useState<'MASUK' | 'KELUAR'>('KELUAR');

  const filtered = categories.filter(c => c.type === type);
  const options = [
    { value: '', label: 'Pilih Kategori' },
    ...filtered.map(c => ({ value: c.name, label: c.name })),
  ];

  return (
    <>
      {/* Jenis transaksi — radio cards */}
      <div className="text-xs font-medium text-slate-600 flex flex-col gap-2">
        <label>Jenis transaksi</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="hidden" name="type" value={type} />
          
          <button
            type="button"
            onClick={() => setType('MASUK')}
            className={`relative flex h-11 items-center gap-2.5 rounded-xl border px-3 text-left transition-all ${
              type === 'MASUK' 
                ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/50' 
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <ArrowDownLeft className={`size-4 shrink-0 ${type === 'MASUK' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <p className={`flex-1 font-medium text-[13px] sm:text-sm ${type === 'MASUK' ? 'text-emerald-700' : 'text-slate-700'}`}>Kas Masuk</p>
            
            {type === 'MASUK' && (
              <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check strokeWidth={3} className="size-2.5" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setType('KELUAR')}
            className={`relative flex h-11 items-center gap-2.5 rounded-xl border px-3 text-left transition-all ${
              type === 'KELUAR' 
                ? 'border-red-500 ring-1 ring-red-500 bg-red-50/50' 
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <ArrowUpRight className={`size-4 shrink-0 ${type === 'KELUAR' ? 'text-red-500' : 'text-slate-400'}`} />
            <p className={`flex-1 font-medium text-[13px] sm:text-sm ${type === 'KELUAR' ? 'text-red-700' : 'text-slate-700'}`}>Kas Keluar</p>
            
            {type === 'KELUAR' && (
              <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                <Check strokeWidth={3} className="size-2.5" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Kategori — filtered dynamically */}
      <label className="text-xs font-medium text-slate-600">
        Kategori
        {filtered.length > 0 ? (
          <AppSelect
            key={type}
            name="category"
            defaultValue=""
            className={inputCls}
            options={options}
          />
        ) : (
          <input
            name="category"
            required
            className={inputCls}
            placeholder="Operasional, listrik, pemasukan lain..."
          />
        )}
      </label>
    </>
  );
}
