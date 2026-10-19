import "server-only";

/**
 * 로그인 실패 횟수 제한. 인스턴스 메모리 기반이라 서버리스 다중 인스턴스
 * 환경에서는 느슨하게 동작한다(인스턴스별로 따로 셈) — 이 앱 규모에선
 * 무차별 대입을 늦추는 용도로 충분하지만, 엄격한 보장이 필요하면 Firestore
 * 카운터 등으로 바꿔야 한다.
 */
const FAIL_LIMIT = 5;
const LOCK_MS = 10 * 60 * 1000;

interface Entry {
  fails: number;
  lockedUntil: number;
}

const store = new Map<string, Entry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.lockedUntil && entry.lockedUntil < now && entry.fails < FAIL_LIMIT) {
      store.delete(key);
    }
  }
}

export function checkLocked(key: string): { locked: boolean; retryAfterMs: number } {
  const entry = store.get(key);
  if (!entry) return { locked: false, retryAfterMs: 0 };
  const remain = entry.lockedUntil - Date.now();
  if (entry.fails >= FAIL_LIMIT && remain > 0) {
    return { locked: true, retryAfterMs: remain };
  }
  return { locked: false, retryAfterMs: 0 };
}

export function recordFailure(key: string) {
  const entry = store.get(key) ?? { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= FAIL_LIMIT) {
    entry.lockedUntil = Date.now() + LOCK_MS;
  }
  store.set(key, entry);
  if (Math.random() < 0.05) cleanup();
}

export function recordSuccess(key: string) {
  store.delete(key);
}

export function rateLimitKey(ip: string, extra: string) {
  return `${ip}|${extra}`;
}
