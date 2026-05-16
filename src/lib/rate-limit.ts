import { db } from "@/lib/db";

/**
 * Lightweight rate limiter using the DB (works across Vercel serverless instances).
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowMs = windowSeconds * 1000;

  try {
    const record = await db.rateLimit.findUnique({ where: { key } });

    if (!record || record.resetAt <= now) {
      // Create or reset window
      const resetAt = new Date(now.getTime() + windowMs);
      await db.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    const updated = await db.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: maxRequests - updated.count,
      resetAt: record.resetAt,
    };
  } catch {
    // Fail open — don't block requests if DB is unavailable
    return { allowed: true, remaining: maxRequests, resetAt: new Date(now.getTime() + windowMs) };
  }
}

/** Build a rate limit key from IP + action */
export function rateLimitKey(ip: string, action: string) {
  return `rl:${action}:${ip}`;
}

/** Extract client IP from request headers */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
