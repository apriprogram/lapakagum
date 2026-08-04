'use client';

import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; title?: string; tone: ToastTone };
type ToastContextValue = { showToast: (message: string, tone?: ToastTone, title?: string) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast harus digunakan di dalam ToastProvider');
  return context;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const showToast = useCallback((message: string, tone: ToastTone = 'info', title?: string) => {
    const id = ++nextId.current;
    setItems((current) => [...current.slice(-2), { id, message, tone, title }]);
    window.setTimeout(() => dismiss(id), tone === 'error' ? 5500 : 4000);
  }, [dismiss]);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-region" aria-live="polite" aria-relevant="additions" aria-label="Notifikasi">
      {items.map((item) => {
        const Icon = item.tone === 'success' ? Check : item.tone === 'error' ? AlertTriangle : Info;
        return <div key={item.id} className={`app-toast app-toast-${item.tone}`} role={item.tone === 'error' ? 'alert' : 'status'}>
          <span className="app-toast-icon"><Icon aria-hidden="true" /></span>
          <div className="app-toast-copy">{item.title && <strong>{item.title}</strong>}<p>{item.message}</p></div>
          <button type="button" onClick={() => dismiss(item.id)} aria-label="Tutup notifikasi"><X /></button>
          <span className="app-toast-progress" aria-hidden="true" />
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
}
