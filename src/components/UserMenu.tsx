'use client';


import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, LogIn, LogOut, User, UserRoundPen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function UserMenu({ storefront }: { storefront?: boolean }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (status === 'loading') return <span className="pulse-soft size-9 rounded-xl bg-blue-50" />;
  if (!session?.user) {
    return null;
  }

  const logout = () => {
    window.localStorage.removeItem('lapak:last-activity');
    void signOut({ callbackUrl: '/' });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={storefront ? "flex items-center justify-center text-slate-500 hover:text-slate-800" : "interactive flex size-10 items-center justify-center rounded-xl border border-blue-100 text-slate-500 hover:border-blue-300 hover:text-blue-700"}
        aria-label="Menu akun"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <User className="size-4" />
      </button>
      {open && (
        <div className="account-menu modal-enter absolute right-0 top-12 z-50" role="menu">
          <div className="account-menu__header">
            <p>{session.user.name}</p>
            <span>{session.user.email}</span>
          </div>
          {session.user.role === 'ADMIN' && (
            <>
              <Link onClick={() => setOpen(false)} href="/admin/profile" className="account-menu__item" role="menuitem"><UserRoundPen /> <span>Edit profil</span></Link>
              <Link onClick={() => setOpen(false)} href="/admin/finance" className="account-menu__item" role="menuitem"><LayoutDashboard /> <span>Halaman pengelola</span></Link>
            </>
          )}
          <button type="button" onClick={logout} className="account-menu__item account-menu__logout" role="menuitem">
            <LogOut /> <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
}
