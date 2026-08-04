import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    redirect('/login');
  }
  return session;
}

export async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Akses ditolak');
  }
  return session;
}
