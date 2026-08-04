import { redirect } from 'next/navigation';
import { UserRoundPen } from 'lucide-react';
import ProfileForm from '@/components/ProfileForm';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { name: true, email: true, phone: true, imageUrl: true, role: true, createdAt: true },
  });
  if (!user) redirect('/login');

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <span className="profile-page-icon"><UserRoundPen /></span>
        <div><p className="type-overline text-blue-600">PENGATURAN AKUN</p><h1 className="mt-1 type-page-title">Edit profil</h1><p className="mt-2 type-body-sm text-slate-500">Perbarui foto, identitas akun, dan password yang digunakan untuk masuk.</p></div>
      </div>
      <ProfileForm user={{ ...user, createdAt: user.createdAt.toISOString() }} />
    </div>
  );
}