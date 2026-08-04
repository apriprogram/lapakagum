'use client';

import Image from 'next/image';
import { useActionState, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Eye, EyeOff, Loader2, Save, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { updateProfile, type ProfileState } from '@/app/admin/profile/actions';
import { useToast } from '@/components/ToastProvider';

type ProfileUser = { name: string; email: string; phone: string | null; imageUrl: string | null; role: string; createdAt: string };
const initialState: ProfileState = { status: 'idle', message: '' };

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState(user.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === 'success') showToast(state.message, 'success', 'Profil diperbarui');
    if (state.status === 'error') showToast(state.message, 'error', 'Profil gagal diperbarui');
  }, [showToast, state]);

  const uploadPhoto = async (file: File) => {
    setUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setUploadError('Gunakan foto JPG, PNG, atau WEBP.');
    if (file.size > 5 * 1024 * 1024) return setUploadError('Ukuran foto maksimal 5 MB.');
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Foto gagal diunggah.');
      setImageUrl(result.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Foto gagal diunggah.';
      setUploadError(message);
      showToast(message, 'error', 'Unggah gagal');
    } finally {
      setUploading(false);
    }
  };

  const field = 'mt-2 h-11 w-full rounded-xl border bg-white px-4 outline-none';

  return (
    <form action={action} className="profile-settings-grid">
      <aside className="surface profile-photo-card">
        <div className="profile-photo-preview">
          {imageUrl ? <Image src={imageUrl} alt="Foto profil" fill sizes="144px" className="object-cover" /> : <span>{user.name.slice(0, 2).toUpperCase()}</span>}
          {uploading && <span className="profile-photo-loading"><Loader2 className="animate-spin" /></span>}
        </div>
        <h2>Foto profil</h2><p>Foto tampil pada navbar dan menu akun.</p>
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadPhoto(event.target.files[0])} />
        <button type="button" className="profile-photo-action" onClick={() => fileInput.current?.click()} disabled={uploading}><Camera /> {imageUrl ? 'Ganti foto' : 'Unggah foto'}</button>
        {imageUrl && <button type="button" className="profile-photo-remove" onClick={() => setImageUrl('')}><Trash2 /> Hapus foto</button>}
        <small>JPG, PNG, atau WEBP Â· maks. 5 MB</small>
        {uploadError && <p className="profile-form-error">{uploadError}</p>}
      </aside>

      <div className="profile-settings-main">
        {state.message && <div className={`profile-form-notice is-${state.status}`} role="status">{state.status === 'success' ? <CheckCircle2 /> : <ShieldAlert />}<span>{state.message}</span></div>}
        <section className="surface profile-form-section">
          <div className="profile-section-head"><div><p>INFORMASI AKUN</p><h2>Data pribadi</h2></div><span>AKUN AKTIF</span></div>
          <div className="profile-form-fields">
            <label>Nama lengkap<input className={field} name="name" defaultValue={user.name} required minLength={2} maxLength={80} autoComplete="name" /></label>
            <label>Email / username login<input className={field} name="email" type="email" defaultValue={user.email} required maxLength={254} autoComplete="username" /></label>
            <label>Nomor telepon<input className={field} name="phone" defaultValue={user.phone || ''} maxLength={20} placeholder="Contoh: 0812 3456 7890" autoComplete="tel" /></label>
            <label>Peran akun<input className={field} value={user.role === 'ADMIN' ? 'Administrator' : 'Pelanggan'} disabled readOnly /></label>
          </div>
        </section>

        <section className="surface profile-form-section">
          <div className="profile-section-head"><div><p>KEAMANAN</p><h2>Password</h2></div><ShieldCheck /></div>
          <p className="profile-section-copy">Kosongkan password baru jika Anda hanya ingin memperbarui data profil.</p>
          <div className="profile-form-fields">
            <label className="profile-password-field">Password saat ini<input className={field} name="currentPassword" type={showPasswords ? 'text' : 'password'} required autoComplete="current-password" /><button type="button" onClick={() => setShowPasswords((value) => !value)} aria-label={showPasswords ? 'Sembunyikan password' : 'Tampilkan password'}>{showPasswords ? <EyeOff /> : <Eye />}</button></label>
            <div className="hidden md:block" />
            <label>Password baru<input className={field} name="newPassword" type={showPasswords ? 'text' : 'password'} minLength={8} maxLength={128} autoComplete="new-password" placeholder="Minimal 8 karakter" /></label>
            <label>Konfirmasi password baru<input className={field} name="confirmPassword" type={showPasswords ? 'text' : 'password'} minLength={8} maxLength={128} autoComplete="new-password" /></label>
          </div>
        </section>

        <div className="profile-form-footer"><p>Akun dibuat {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(user.createdAt))}</p><button disabled={pending || uploading} className="admin-data-action"><Save /> {pending ? 'Menyimpan...' : 'Simpan perubahan'}</button></div>
      </div>
    </form>
  );
}
