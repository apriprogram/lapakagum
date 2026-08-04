'use client';

import { Trash2 } from 'lucide-react';
import AdminActionForm from '@/components/AdminActionForm';

export function VendorDeleteButton({ action, disabled }: { action: () => void; disabled: boolean }) {
  return <AdminActionForm action={action} successMessage="Pemasok berhasil dihapus." confirmMessage="Hapus pemasok ini secara permanen?" redirectTo="/admin/vendors">
    <button disabled={disabled} title={disabled ? 'Pemasok yang memiliki transaksi tidak dapat dihapus' : 'Hapus pemasok'} className="interactive flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
      <Trash2 className="size-4" /> Hapus pemasok
    </button>
  </AdminActionForm>;
}


