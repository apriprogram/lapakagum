type AttemptState = {
  failures: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const globalForRateLimit = globalThis as typeof globalThis & {
  loginAttemptStore?: Map<string, AttemptState>;
};

const attempts = globalForRateLimit.loginAttemptStore ?? new Map<string, AttemptState>();
globalForRateLimit.loginAttemptStore = attempts;

export function getLoginKey(email: string, headers: unknown) {
  const headerRecord = (headers && typeof headers === 'object')
    ? headers as Record<string, unknown>
    : {};
  const forwardedFor = headerRecord['x-forwarded-for'];
  const realIp = headerRecord['x-real-ip'];
  const rawIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]
      : typeof realIp === 'string'
        ? realIp
        : 'unknown';

  return `${rawIp.trim() || 'unknown'}:${email}`;
}

export function isLoginBlocked(key: string, now = Date.now()) {
  const state = attempts.get(key);
  if (!state) return false;

  if (state.blockedUntil > now) return true;
  if (now - state.firstAttemptAt >= ATTEMPT_WINDOW_MS) attempts.delete(key);
  return false;
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const previous = attempts.get(key);
  const state = !previous || now - previous.firstAttemptAt >= ATTEMPT_WINDOW_MS
    ? { failures: 1, firstAttemptAt: now, blockedUntil: 0 }
    : { ...previous, failures: previous.failures + 1 };

  if (state.failures >= MAX_FAILURES) state.blockedUntil = now + BLOCK_DURATION_MS;
  attempts.set(key, state);

  // Menjaga penyimpanan sementara tetap terbatas pada proses server yang panjang umur.
  if (attempts.size > 5_000) {
    for (const [storedKey, value] of attempts) {
      if (value.blockedUntil <= now && now - value.firstAttemptAt >= ATTEMPT_WINDOW_MS) {
        attempts.delete(storedKey);
      }
    }
  }
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
