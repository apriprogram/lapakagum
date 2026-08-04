'use client';

import { SessionProvider } from 'next-auth/react';
import SessionSecurity from '@/components/SessionSecurity';
import ToastProvider from '@/components/ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
      <ToastProvider>
        <SessionSecurity />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}

