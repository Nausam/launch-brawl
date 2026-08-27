type RateLimitResult = { success: boolean; remaining: number; reset: number };
const localBuckets = new Map<string, { count: number; reset: number }>();

export async function rateLimit(key: string, limit = 30, windowMs = 60_000): Promise<RateLimitResult> {
  const now = Date.now();
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const response = await fetch(`${redisUrl}/incr/${encodeURIComponent(`launchbrawl:${key}`)}`, { headers: { Authorization: `Bearer ${redisToken}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Redis rate limit request failed.");
      const body = await response.json() as { result?: number };
      const count = Number(body.result ?? 0);
      if (count === 1) {
        await fetch(`${redisUrl}/pexpire/${encodeURIComponent(`launchbrawl:${key}`)}/${windowMs}`, { headers: { Authorization: `Bearer ${redisToken}` }, cache: "no-store" });
      }
      return { success: count <= limit, remaining: Math.max(0, limit - count), reset: now + windowMs };
    } catch {
      if (process.env.NODE_ENV === "production") return { success: false, remaining: 0, reset: now + windowMs };
    }
  } else if (process.env.NODE_ENV === "production") {
    return { success: false, remaining: 0, reset: now + windowMs };
  }
  const bucket = localBuckets.get(key);
  if (!bucket || bucket.reset <= now) {
    localBuckets.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }
  bucket.count += 1;
  return { success: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), reset: bucket.reset };
}
