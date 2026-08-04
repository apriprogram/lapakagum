'use server';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export type ProfileState = { status: 'idle' | 'success' | 'error'; message: string };

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await assertAdmin();
  const userId = Number(session.user.id);
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (name.length < 2 || name.length > 80) return { status: 'error', message: 'Nama harus terdiri dari 2–80 karakter.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { status: 'error', message: 'Email atau username login tidak valid.' };
  if (phone && (phone.length < 8 || phone.length > 20 || !/^[+\d][\d\s()-]+$/.test(phone))) return { status: 'error', message: 'Nomor telepon tidak valid.' };
  if (imageUrl && !/^\/uploads\/[a-zA-Z0-9._-]+$/.test(imageUrl)) return { status: 'error', message: 'Lokasi foto profil tidak valid.' };
  if (!currentPassword) return { status: 'error', message: 'Masukkan password saat ini untuk menyimpan perubahan.' };
  if (newPassword && (newPassword.length < 8 || newPassword.length > 128)) return { status: 'error', message: 'Password baru harus terdiri dari 8–128 karakter.' };
  if (newPassword !== confirmPassword) return { status: 'error', message: 'Konfirmasi password baru tidak sama.' };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) return { status: 'error', message: 'Password saat ini salah.' };

  try {
    const password = newPassword ? await bcrypt.hash(newPassword, 12) : user.password;
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { name, email, phone: phone || null, imageUrl: imageUrl || null, password } }),
      prisma.auditLog.create({ data: { action: 'UPDATE_PROFILE', entity: 'User', entityId: String(userId), details: newPassword ? 'Profil dan password diperbarui' : 'Profil diperbarui' } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { status: 'error', message: 'Email tersebut sudah digunakan akun lain.' };
    return { status: 'error', message: 'Profil gagal disimpan. Silakan coba lagi.' };
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/profile');
  return { status: 'success', message: 'Profil berhasil diperbarui.' };
}