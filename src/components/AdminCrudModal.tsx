'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useSyncExternalStore } from 'react';

interface AdminCrudModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  size?: 'medium' | 'large' | 'xlarge';
}

export default function AdminCrudModal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  size = 'large',
}: AdminCrudModalProps) {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.querySelector('.app-dropdown-menu, .admin-date-popover')) return;
        onClose();
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="admin-crud-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={'admin-crud-modal admin-crud-modal-' + size}
      >
        <header className="admin-crud-header">
          <span className="admin-crud-header-icon">{icon}</span>
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{description}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Tutup modal">
            <X />
          </button>
        </header>
        <div className="admin-crud-content">{children}</div>
      </div>
    </div>,
    document.body,
  );
}




