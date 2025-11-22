import { redis } from "@/lib/redis";

const PROFILE_RATE_WINDOW_SECONDS = 60; // 1 minute
const PROFILE_RATE_MAX = 30;
const PROFILE_RATE_NAMESPACE = "profile:rl";

type ProfileRateLimitContext = {
  userId?: string | null;
  ip?: string | null;
};

async function hitRateLimitKey(redisKey: string) {
  const current = await redis.incr(redisKey);

  if (current === 1) {
    await redis.expire(redisKey, PROFILE_RATE_WINDOW_SECONDS);
  }

  return current > PROFILE_RATE_MAX;
}

export async function consumeProfileRateLimit(
  context: ProfileRateLimitContext
) {
  const keys: string[] = [];

  if (context.userId) {
    keys.push(`${PROFILE_RATE_NAMESPACE}:user:${context.userId}`);
  }

  if (context.ip) {
    keys.push(`${PROFILE_RATE_NAMESPACE}:ip:${context.ip}`);
  }

  if (!keys.length) {
    return false;
  }

  try {
    let limited = false;

    for (const redisKey of keys) {
      const keyLimited = await hitRateLimitKey(redisKey);
      if (keyLimited) {
        limited = true;
      }
    }

    return limited;
  } catch (error) {
    console.error("profile rate limit fallback", error);
    // Fail-open to avoid blocking users if Redis is unavailable.
    return false;
  }
}
