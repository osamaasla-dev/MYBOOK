import { redis } from "@/lib/redis";
import type { Logger } from "pino";

import {
  POST_VIEW_RATE_LIMIT_MAX,
  POST_VIEW_RATE_LIMIT_NAMESPACE,
  POST_VIEW_RATE_LIMIT_WINDOW_SECONDS,
} from "./constants";

function rateLimitKey(viewerKey: string, windowSeconds: number) {
  return `${POST_VIEW_RATE_LIMIT_NAMESPACE}:${viewerKey}:${windowSeconds}`;
}

export async function consumePostViewRateLimit(
  viewerKey: string | null,
  {
    limit = POST_VIEW_RATE_LIMIT_MAX,
    windowSeconds = POST_VIEW_RATE_LIMIT_WINDOW_SECONDS,
    log,
  }: { limit?: number; windowSeconds?: number; log?: Logger } = {}
): Promise<boolean> {
  if (!viewerKey) return false;

  const redisKey = rateLimitKey(viewerKey, windowSeconds);

  try {
    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    return current > limit;
  } catch (error) {
    log?.error({ viewerKey, error }, "consumePostViewRateLimit failed");
    return false;
  }
}
