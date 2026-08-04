'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    
    // Auto focus on the first focusable element or close button
    window.requestAnimationFrame(() => {
      if (panelRef.current) {
        const input = panelRef.current.querySelector('input, textarea, select');
        if (input) (input as HTMLElement).focus();
        else closeButtonRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.querySelector('.app-dropdown-menu, .admin-date-popover')) return;
        onClose();
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      
      // Trap focus
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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

  if (!mounted || !render) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} 
      role="presentation" 
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`surface w-full ${maxWidth} p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {icon}
              </span>
            )}
            <h2 id={titleId} className="text-base font-semibold text-blue-950">
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </header>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
