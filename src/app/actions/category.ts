'use server';

import { prisma } from '@/lib/prisma';
import { assertAdmin } from '@/lib/admin';
import { textValue } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

function refresh() {
  revalidatePath('/admin/product-categories');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/purchases/new');
  revalidatePath('/admin/orders/new');
}

export async function createCategory(formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, 'name', 'Nama kategori');
  const slug = slugify(name);
  await prisma.productCategory.create({ data: { name, slug } });
  refresh();
}

export async function updateCategory(id: number, formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, 'name', 'Nama kategori');
  const slug = slugify(name);
  await prisma.productCategory.update({ where: { id }, data: { name, slug } });
  refresh();
}

export async function deleteCategory(id: number) {
  await assertAdmin();
  const cat = await prisma.productCategory.findUniqueOrThrow({ where: { id } });
  // Cek apakah ada produk yang memakai kategori ini
  const usedCount = await prisma.product.count({ where: { category: cat.slug } });
  if (usedCount > 0) {
    throw new Error(
      `Kategori "${cat.name}" masih digunakan oleh ${usedCount} barang. Ubah kategori barang tersebut terlebih dahulu sebelum menghapus.`
    );
  }
  await prisma.productCategory.delete({ where: { id } });
  refresh();
}
