import { redis } from "@/lib/redis";

type RateLimitIdentifier = {
  key: string;
  value?: string | null;
};

export type RateLimitOptions = {
  namespace: string;
  identifiers: RateLimitIdentifier[];
  windowSeconds: number;
  maxRequests: number;
};

async function hitRateLimitKey(
  key: string,
  windowSeconds: number,
  maxRequests: number
) {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  return current > maxRequests;
}

export async function consumeRateLimit({
  namespace,
  identifiers,
  windowSeconds,
  maxRequests,
}: RateLimitOptions) {
  const keys = identifiers
    .map(({ key, value }) => {
      if (!value) {
        return null;
      }

      return `${namespace}:${key}:${value}`;
    })
    .filter(Boolean) as string[];

  if (!keys.length) {
    return false;
  }

  try {
    let limited = false;

    for (const key of keys) {
      const keyLimited = await hitRateLimitKey(key, windowSeconds, maxRequests);
      if (keyLimited) {
        limited = true;
      }
    }

    return limited;
  } catch (error) {
    console.error("rate limit fallback", { namespace, error });
    return false;
  }
}
