'use server';

import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/admin';
import { textValue } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { CashFlowType } from '@prisma/client';

const refresh = () => {
  revalidatePath('/admin/cash-categories');
  revalidatePath('/admin/finance');
};

export async function createCashCategory(formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, 'name', 'Nama kategori');
  const type = textValue(formData, 'type', 'Jenis') as CashFlowType;
  await prisma.cashCategory.create({ data: { name, type } });
  refresh();
}

export async function updateCashCategory(id: number, formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, 'name', 'Nama kategori');
  const type = textValue(formData, 'type', 'Jenis') as CashFlowType;
  await prisma.cashCategory.update({ where: { id }, data: { name, type } });
  refresh();
}

export async function deleteCashCategory(id: number) {
  await assertAdmin();
  await prisma.cashCategory.delete({ where: { id } });
  refresh();
}
