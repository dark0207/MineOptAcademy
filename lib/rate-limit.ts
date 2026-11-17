type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Small in-memory limiter for sign-in attempts (per server process).
 * Returns the seconds to wait when the key is over its limit, otherwise 0.
 */
export function checkRateLimit(key: string, limit = 8, windowMs = 15 * 60 * 1000): number {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  bucket.count += 1;
  return bucket.count > limit ? Math.ceil((bucket.resetAt - now) / 1000) : 0;
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
