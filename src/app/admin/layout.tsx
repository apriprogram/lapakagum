import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) }, select: { name: true, imageUrl: true } });
  return <AdminShell userName={user?.name || session.user?.name || 'Pengelola'} userImage={user?.imageUrl}>{children}</AdminShell>;
}
