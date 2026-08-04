'use server';

import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/admin';
import { optionalText, positiveNumber, textValue } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

function refresh() {
  revalidatePath('/');
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/finance');
}

export async function createProduct(formData: FormData) {
  await assertAdmin();
  await prisma.product.create({
    data: {
      name: textValue(formData, 'name', 'Nama barang'),
      category: textValue(formData, 'category', 'Kategori'),
      imageUrl: optionalText(formData, 'imageUrl'),
      unit: textValue(formData, 'unit', 'Satuan'),
      buyPrice: positiveNumber(formData, 'buyPrice', 'Harga beli', true),
      price: positiveNumber(formData, 'price', 'Harga jual'),
      stock: 0,
      isActive: true,
    },
  });
  refresh();
}

export async function updateProduct(id: number, formData: FormData) {
  await assertAdmin();
  await prisma.product.update({
    where: { id },
    data: {
      name: textValue(formData, 'name', 'Nama barang'),
      category: textValue(formData, 'category', 'Kategori'),
      imageUrl: optionalText(formData, 'imageUrl'),
      unit: textValue(formData, 'unit', 'Satuan'),
      buyPrice: positiveNumber(formData, 'buyPrice', 'Harga beli', true),
      price: positiveNumber(formData, 'price', 'Harga jual'),
      isActive: true,
    },
  });
  refresh();
}

export async function toggleProduct(id: number) {
  await assertAdmin();
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
  refresh();
}

export async function deleteProduct(id: number) {
  await assertAdmin();
  const used = await prisma.product.findUnique({
    where: { id },
    select: { _count: { select: { orderItems: true, purchaseItems: true } } },
  });
  if (!used) return;
  if (used._count.orderItems || used._count.purchaseItems) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }
  refresh();
}
