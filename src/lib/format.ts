export function currency(value: number | string) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
  
  // Normalize narrow no-break space and non-breaking space to standard space
  // This prevents React hydration mismatches between Node.js and Chrome
  return formatted.replace(/[\u202F\u00A0]/g, ' ');
}

export function number(value: number | string, digits = 3) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: digits,
  }).format(Number(value));
}

export function date(value: Date | string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function dateWithDay(value: Date | string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function startOfDay(value = new Date()) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(value = new Date()) {
  const result = new Date(value);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function orderStatusLabel(value: string) {
  return ({ BARU: 'Baru masuk', DIPROSES: 'Sedang disiapkan', SELESAI: 'Selesai', DIBATALKAN: 'Dibatalkan' } as Record<string, string>)[value] || value.replaceAll('_', ' ').toLowerCase();
}

export function paymentTypeLabel(value: string) {
  return ({ TUNAI: 'Tunai', TRANSFER: 'Transfer bank', TEMPO: 'Bayar nanti' } as Record<string, string>)[value] || value.replaceAll('_', ' ').toLowerCase();
}

export function stockMovementLabel(value: string) {
  return ({ PEMBELIAN: 'Stok dari pembelian', PENJUALAN: 'Stok terjual', RETUR_VENDOR: 'Dikembalikan ke pemasok', SUSUT_RUSAK: 'Rusak atau menyusut', CARRY_OVER: 'Dibawa ke hari berikutnya', PENYESUAIAN_MASUK: 'Penambahan stok', PENYESUAIAN_KELUAR: 'Pengurangan stok', PEMBATALAN_PENJUALAN: 'Stok kembali karena pesanan dibatalkan' } as Record<string, string>)[value] || value.replaceAll('_', ' ').toLowerCase();
}

export function capitalTypeLabel(value: string) {
  return ({ SETORAN: 'Modal awal', TAMBAHAN: 'Tambahan modal', PRIVE: 'Penarikan oleh pemilik' } as Record<string, string>)[value] || value.replaceAll('_', ' ').toLowerCase();
}

