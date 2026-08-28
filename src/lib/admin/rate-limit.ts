import "server-only";

type Bucket = { count: number; resetAt: number };
const developmentBuckets = new Map<string, Bucket>();

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("RATE_LIMIT_NOT_CONFIGURED");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("RATE_LIMIT_UNAVAILABLE");
  const payload = (await response.json()) as { result?: T; error?: string };
  if (payload.error) throw new Error("RATE_LIMIT_UNAVAILABLE");
  return payload.result as T;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const count = await redisCommand<number>(["INCR", `portfolio-admin:${key}`]);
    if (count === 1) {
      await redisCommand(["EXPIRE", `portfolio-admin:${key}`, windowSeconds]);
    }
    const ttl = Math.max(
      1,
      await redisCommand<number>(["TTL", `portfolio-admin:${key}`]),
    );
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter: ttl };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_NOT_CONFIGURED");
  }

  const now = Date.now();
  const current = developmentBuckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowSeconds * 1000 }
    : { ...current, count: current.count + 1 };
  developmentBuckets.set(key, bucket);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export async function clearRateLimit(key: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    await redisCommand(["DEL", `portfolio-admin:${key}`]);
    return;
  }
  developmentBuckets.delete(key);
}
