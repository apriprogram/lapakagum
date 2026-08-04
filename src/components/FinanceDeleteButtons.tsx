'use client';

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { useToast } from '@/components/ToastProvider';
import { deleteCashTransaction, deleteCapitalTransaction } from '@/app/actions/business';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/ConfirmDialog';

// ─── Delete Cash Transaction ────────────────────────────────────────────────
export function DeleteCashBtn({ id, category }: { id: number; category: string }) {
  const [pending, start] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  // Semua transaksi bisa dihapus manual sesuai permintaan pengguna

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Batalkan transaksi kas?',
      message: `Transaksi "${category}" akan dihapus permanen.\nTindakan ini tidak dapat diurungkan.`,
      confirmLabel: 'Ya, batalkan',
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteCashTransaction(id);
        showToast('Transaksi kas berhasil dibatalkan.', 'success', 'Berhasil');
        router.refresh();
      } catch {
        showToast('Gagal membatalkan transaksi.', 'error', 'Error');
      }
    });
  };

  return (
    <>
      {dialog}
      <button
        onClick={handleDelete}
        disabled={pending}
        title="Batalkan transaksi ini"
        className="flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-300 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </>
  );
}

// ─── Delete Capital Transaction ──────────────────────────────────────────────
export function DeleteCapitalBtn({ id, type }: { id: number; type: string }) {
  const [pending, start] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  const typeLabel =
    type === 'SETORAN' ? 'Modal awal' : type === 'TAMBAHAN' ? 'Tambahan modal' : 'Penarikan pemilik';

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Batalkan perubahan modal?',
      message: `"${typeLabel}" akan dibatalkan.\nSaldo kas yang terkait juga akan dikembalikan secara otomatis.\n\nTindakan ini tidak dapat diurungkan.`,
      confirmLabel: 'Ya, batalkan',
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteCapitalTransaction(id);
        showToast('Perubahan modal berhasil dibatalkan dan saldo kas telah dikembalikan.', 'success', 'Berhasil');
        router.refresh();
      } catch {
        showToast('Gagal membatalkan perubahan modal.', 'error', 'Error');
      }
    });
  };

  return (
    <>
      {dialog}
      <button
        onClick={handleDelete}
        disabled={pending}
        title="Batalkan perubahan modal ini"
        className="flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-300 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </>
  );
}
