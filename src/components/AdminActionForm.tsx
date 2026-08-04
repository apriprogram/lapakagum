'use client';

import { useRouter } from 'next/navigation';
import { forwardRef, useState } from 'react';
import { useToast } from '@/components/ToastProvider';

type ActionResult = void | { ok?: boolean; message?: string } | Record<string, unknown>;
interface AdminActionFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action' | 'onSubmit'> {
  action: (formData: FormData) => ActionResult | Promise<ActionResult>;
  successMessage: string;
  successTitle?: string;
  resetOnSuccess?: boolean;
  confirmMessage?: string;
  redirectTo?: string;
  onSuccess?: () => void;
}

function readableError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^Error:\s*/i, '').trim();
    if (message && !message.includes('NEXT_REDIRECT') && !message.includes('Server Components render')) return message;
  }
  return 'Terjadi kesalahan. Periksa data lalu coba kembali.';
}

const AdminActionForm = forwardRef<HTMLFormElement, AdminActionFormProps>(function AdminActionForm({ action, successMessage, successTitle = 'Berhasil', resetOnSuccess = false, confirmMessage, redirectTo, onSuccess, children, className, ...props }, ref) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || (confirmMessage && !window.confirm(confirmMessage))) return;
    const form = event.currentTarget;
    setPending(true);
    try {
      const result = await action(new FormData(form));
      if (result && 'ok' in result && result.ok === false) {
        showToast(typeof result.message === 'string' ? result.message : 'Tindakan gagal diselesaikan.', 'error', 'Gagal');
        return;
      }
      showToast(result && 'message' in result && typeof result.message === 'string' ? result.message : successMessage, 'success', successTitle);
      if (resetOnSuccess) form.reset();
      onSuccess?.();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch (error) {
      showToast(readableError(error), 'error', 'Tindakan gagal');
    } finally {
      setPending(false);
    }
  };
  return <form {...props} ref={ref} className={`${className ?? ''}${pending ? ' is-submitting' : ''}`} onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending} className="contents">{children}</fieldset>
  </form>;
});

export default AdminActionForm;



