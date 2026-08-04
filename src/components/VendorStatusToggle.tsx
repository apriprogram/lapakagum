'use client';

import { useRef } from 'react';
import AdminActionForm from '@/components/AdminActionForm';

export function VendorStatusToggle({ active, action, name, entity = 'pemasok' }: { active: boolean; action: () => void; name: string; entity?: string }) {
  const form = useRef<HTMLFormElement>(null);
  return <AdminActionForm ref={form} action={action} successMessage={`${entity === 'produk' ? 'Produk' : 'Pemasok'} berhasil ${active ? 'dinonaktifkan' : 'diaktifkan'}.`} className="flex items-center gap-2">
    <span className={`text-[10px] font-medium ${active ? 'text-emerald-700' : 'text-slate-400'}`}>{active ? 'Aktif' : 'Nonaktif'}</span>
    <label className="relative inline-flex cursor-pointer items-center" title={`${active ? 'Nonaktifkan' : 'Aktifkan'} ${name}`}>
      <input type="checkbox" role="switch" checked={active} onChange={() => form.current?.requestSubmit()} className="peer sr-only" aria-label={`${active ? 'Nonaktifkan' : 'Aktifkan'} ${entity} ${name}`} />
      <span className="h-6 w-11 rounded-full border border-slate-200 bg-slate-200 transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-emerald-500/20 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
    </label>
  </AdminActionForm>;
}

