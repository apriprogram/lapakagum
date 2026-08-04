'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

export function AdminThemeToggle({ storefront }: { storefront?: boolean }) {
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme');
    const dark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('admin-dark', dark);
  }, []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains('admin-dark');
    document.documentElement.classList.toggle('admin-dark', next);
    localStorage.setItem('admin-theme', next ? 'dark' : 'light');
  };

  return <button type="button" onClick={toggle} className={storefront ? "flex items-center justify-center text-slate-500 hover:text-slate-800" : "admin-icon-button admin-theme-toggle"} aria-label="Ubah tema terang atau gelap" title="Ubah tema">
    <Moon className={storefront ? "size-4 hidden dark:block" : "theme-moon"} />
    <Sun className={storefront ? "size-4 block dark:hidden" : "theme-sun"} />
  </button>;
}