'use client';

import { RotateCcw } from 'lucide-react';
import { resetAllTransactionHistory } from '@/app/actions/business';
import AdminActionForm from '@/components/AdminActionForm';

export function AdminResetHistoryButton() {
  return <AdminActionForm
    action={resetAllTransactionHistory}
    successMessage="Seluruh riwayat transaksi berhasil direset."
    confirmMessage="Reset seluruh riwayat transaksi? Pesanan, pembelian, stok, kas, modal, pembayaran, dan tutup hari akan dihapus permanen. Produk, pemasok, dan akun tetap tersimpan."
  >
    <button type="submit" className="admin-reset-history"><RotateCcw /> Reset seluruh riwayat</button>
  </AdminActionForm>;
}
