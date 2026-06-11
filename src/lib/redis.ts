import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const aiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "writeguard:ai",
    })
  : null;

export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "writeguard:auth",
    })
  : null;

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{ success: boolean; remaining?: number }> {
  if (!limiter) return { success: true };
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}

export { redis };
