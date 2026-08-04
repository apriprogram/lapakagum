'use client';

import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => confirmRef.current?.focus());
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', keydown);
    };
  }, [open, onCancel]);

  if (!mounted || !render) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-msg"
      >
        {/* Icon */}
        <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
          <AlertTriangle className={`size-6 ${danger ? 'text-red-500' : 'text-blue-500'}`} />
        </div>

        {/* Content */}
        <h2 id="confirm-title" className="text-center text-base font-semibold text-slate-900">{title}</h2>
        <p id="confirm-msg" className="mt-2 text-center text-sm text-slate-500 leading-relaxed whitespace-pre-line">{message}</p>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${danger ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Hook untuk menggunakan konfirmasi modal secara programatik */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    resolve: ((ok: boolean) => void) | null;
  }>({ open: false, title: '', message: '', resolve: null });

  const confirm = (opts: { title: string; message: string; confirmLabel?: string; danger?: boolean }) =>
    new Promise<boolean>((resolve) =>
      setState({ open: true, resolve, ...opts }),
    );

  const handleConfirm = () => {
    state.resolve?.(true);
    setState(s => ({ ...s, open: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState(s => ({ ...s, open: false, resolve: null }));
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel ?? 'Ya, hapus'}
      danger={state.danger ?? true}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}

export default ConfirmDialog;
