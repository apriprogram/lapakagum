'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 30 * 1000;
const ACTIVITY_KEY = 'lapak:last-activity';

export default function SessionSecurity() {
  const { status } = useSession();
  const lastActivity = useRef<number | null>(null);
  const lastStoredAt = useRef(0);
  const signingOut = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const storedActivity = Number(window.localStorage.getItem(ACTIVITY_KEY));
    lastActivity.current = Number.isFinite(storedActivity) && storedActivity > 0
      ? storedActivity
      : Date.now();

    const saveActivity = () => {
      const now = Date.now();
      lastActivity.current = now;
      if (now - lastStoredAt.current >= ACTIVITY_WRITE_INTERVAL_MS) {
        window.localStorage.setItem(ACTIVITY_KEY, String(now));
        lastStoredAt.current = now;
      }
    };

    const syncActivity = (event: StorageEvent) => {
      if (event.key !== ACTIVITY_KEY) return;
      const timestamp = Number(event.newValue);
      if (Number.isFinite(timestamp)) lastActivity.current = timestamp;
    };

    const checkIdleTime = () => {
      if (lastActivity.current === null || signingOut.current) return;
      if (Date.now() - lastActivity.current < IDLE_TIMEOUT_MS) return;
      signingOut.current = true;
      window.localStorage.removeItem(ACTIVITY_KEY);
      void signOut({ callbackUrl: '/?reason=idle' });
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, saveActivity, { passive: true }));
    window.addEventListener('storage', syncActivity);
    document.addEventListener('visibilitychange', checkIdleTime);
    const interval = window.setInterval(checkIdleTime, 30 * 1000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, saveActivity));
      window.removeEventListener('storage', syncActivity);
      document.removeEventListener('visibilitychange', checkIdleTime);
      window.clearInterval(interval);
    };
  }, [status]);

  return null;
}
