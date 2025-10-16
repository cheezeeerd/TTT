const WINDOW_MS = 60_000; // 1 minute
const MAX = 30;

const store = new Map<string, { count: number; ts: number }>();

export function rateLimit(key: string) {
  const now = Date.now();
  const rec = store.get(key);
  if (!rec || now - rec.ts > WINDOW_MS) {
    store.set(key, { count: 1, ts: now });
    return { allowed: true, remaining: MAX - 1 };
  }
  if (rec.count >= MAX) return { allowed: false, remaining: 0 };
  rec.count += 1;
  return { allowed: true, remaining: MAX - rec.count };
}
