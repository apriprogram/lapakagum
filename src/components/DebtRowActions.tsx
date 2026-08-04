'use client';

import { Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';
import { deleteStandaloneDebt } from '@/app/actions/debt';

export default function DebtRowActions({ id, vendorName }: { id: number, vendorName: string }) {
  const { confirm, dialog } = useConfirm();
  const { showToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Hapus hutang?',
      message: `Hapus seluruh hutang kepada ${vendorName} beserta riwayat pembayarannya?`,
      confirmLabel: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;

    try {
      const result = await deleteStandaloneDebt(id);
      if (result && 'ok' in result && result.ok === false) {
        showToast(typeof result.message === 'string' ? result.message : 'Gagal menghapus hutang', 'error', 'Error');
        return;
      }
      showToast('Hutang berhasil dihapus.', 'success', 'Berhasil');
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus', 'error', 'Error');
    }
  };

  return (
    <>
      {dialog}
      <button 
        onClick={handleDelete} 
        className="interactive flex size-9 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors" 
        title="Hapus hutang"
      >
        <Trash2 className="size-4" />
      </button>
    </>
  );
}
