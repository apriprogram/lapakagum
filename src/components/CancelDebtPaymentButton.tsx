'use client';

import { X } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';
import { cancelStandaloneDebtPayment } from '@/app/actions/debt';
import { currency } from '@/lib/format';

export default function CancelDebtPaymentButton({ id, vendorName, amount }: { id: number, vendorName: string, amount: number }) {
  const { confirm, dialog } = useConfirm();
  const { showToast } = useToast();
  const router = useRouter();

  const handleCancelPayment = async () => {
    const ok = await confirm({
      title: 'Batalkan pembayaran?',
      message: `Pembayaran sebesar ${currency(amount)} untuk hutang kepada ${vendorName} akan dibatalkan dan nominal sisa hutang akan dikembalikan seperti semula.`,
      confirmLabel: 'Ya, batalkan',
      danger: true,
    });
    if (!ok) return;

    try {
      const result = await cancelStandaloneDebtPayment(id);
      if (result && 'ok' in result && result.ok === false) {
        showToast(typeof result.message === 'string' ? result.message : 'Gagal membatalkan pembayaran', 'error', 'Error');
        return;
      }
      showToast('Pembayaran berhasil dibatalkan.', 'success', 'Berhasil');
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal membatalkan', 'error', 'Error');
    }
  };

  return (
    <>
      {dialog}
      <button 
        onClick={handleCancelPayment} 
        className="ml-4 flex size-7 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors shrink-0" 
        title="Batal"
        aria-label="Batal"
      >
        <X className="size-4" />
      </button>
    </>
  );
}
