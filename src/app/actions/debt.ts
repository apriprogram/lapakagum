'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/admin';
import { dateValue, optionalText, positiveNumber } from '@/lib/validation';

type DebtActionResult = { ok: boolean; message: string };

function actionError(error: unknown): DebtActionResult {
  return { ok: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses hutang.' };
}

function refreshDebts() {
  revalidatePath('/admin/debts');
  revalidatePath('/admin/finance');
}

export async function createStandaloneDebt(formData: FormData): Promise<DebtActionResult> {
  try {
    await assertAdmin();
    const vendorId = positiveNumber(formData, 'vendorId', 'Pemasok');
    const debtDate = dateValue(formData, 'debtDate', 'Tanggal hutang');
    const amount = positiveNumber(formData, 'amount', 'Nominal hutang');
    const notes = optionalText(formData, 'notes');
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { name: true } });
    if (!vendor) throw new Error('Pemasok tidak ditemukan.');

    const existing = await prisma.standaloneDebt.findUnique({ where: { vendorId } });
    const debt = existing
      ? await prisma.standaloneDebt.update({
          where: { id: existing.id },
          data: {
            amount: { increment: amount },
            debtDate: existing.debtDate < debtDate ? existing.debtDate : debtDate,
            dueDate: null,
            reference: null,
            notes: notes ? [existing.notes, notes].filter(Boolean).join(' · ') : existing.notes,
          },
        })
      : await prisma.standaloneDebt.create({ data: { vendorId, debtDate, amount, notes } });

    await prisma.auditLog.create({
      data: {
        action: existing ? 'INCREMENT' : 'CREATE',
        entity: 'StandaloneDebt',
        entityId: String(debt.id),
        details: `${existing ? 'Penambahan' : 'Hutang mandiri'} ${vendor.name}`,
      },
    });
    refreshDebts();
    return {
      ok: true,
      message: existing
        ? `Hutang baru digabungkan ke total hutang ${vendor.name}.`
        : `Hutang kepada ${vendor.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function recordStandaloneDebtPayment(debtId: number, formData: FormData): Promise<DebtActionResult> {
  try {
    await assertAdmin();
    const amount = positiveNumber(formData, 'amount', 'Nominal pembayaran');
    const paymentDate = dateValue(formData, 'date', 'Tanggal pembayaran');
    const debt = await prisma.standaloneDebt.findUnique({
      where: { id: debtId },
      include: { vendor: { select: { name: true } } },
    });
    if (!debt) throw new Error('Data hutang tidak ditemukan.');
    const remaining = Number(debt.amount) - Number(debt.paidAmount);
    if (remaining <= 0) throw new Error('Hutang ini sudah lunas.');
    if (amount > remaining + 0.01) throw new Error('Pembayaran melebihi sisa hutang.');

    await prisma.$transaction([
      prisma.standaloneDebtPayment.create({
        data: { debtId, date: paymentDate, amount, notes: optionalText(formData, 'notes') },
      }),
      prisma.standaloneDebt.update({ where: { id: debtId }, data: { paidAmount: { increment: amount } } }),
      prisma.auditLog.create({
        data: { action: 'PAYMENT', entity: 'StandaloneDebt', entityId: String(debtId), details: `Pembayaran hutang ${debt.vendor.name}` },
      }),
    ]);
    refreshDebts();
    return { ok: true, message: `Pembayaran hutang kepada ${debt.vendor.name} berhasil dicatat.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteStandaloneDebt(debtId: number): Promise<DebtActionResult> {
  try {
    await assertAdmin();
    const debt = await prisma.standaloneDebt.findUnique({
      where: { id: debtId },
      include: { vendor: { select: { name: true } } },
    });
    if (!debt) throw new Error('Data hutang tidak ditemukan.');
    await prisma.standaloneDebt.delete({ where: { id: debtId } });
    await prisma.auditLog.create({
      data: { action: 'DELETE', entity: 'StandaloneDebt', entityId: String(debtId), details: `Hutang mandiri ${debt.vendor.name}` },
    });
    refreshDebts();
    return { ok: true, message: `Hutang kepada ${debt.vendor.name} berhasil dihapus.` };
  } catch (error) {
    return actionError(error);
  }
}
export async function cancelStandaloneDebtPayment(paymentId: number): Promise<DebtActionResult> {
  try {
    await assertAdmin();
    const payment = await prisma.standaloneDebtPayment.findUnique({
      where: { id: paymentId },
      include: { debt: { include: { vendor: { select: { name: true } } } } },
    });
    if (!payment) throw new Error('Data pembayaran tidak ditemukan.');

    await prisma.$transaction([
      prisma.standaloneDebtPayment.delete({ where: { id: paymentId } }),
      prisma.standaloneDebt.update({ 
        where: { id: payment.debtId }, 
        data: { paidAmount: { decrement: payment.amount } } 
      }),
      prisma.auditLog.create({
        data: { action: 'DELETE', entity: 'StandaloneDebtPayment', entityId: String(paymentId), details: `Batal bayar hutang ${payment.debt.vendor.name}` },
      }),
    ]);
    refreshDebts();
    return { ok: true, message: `Pembayaran hutang kepada ${payment.debt.vendor.name} berhasil dibatalkan.` };
  } catch (error) {
    return actionError(error);
  }
}
