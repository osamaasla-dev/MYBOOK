import { redis } from "@/lib/redis";
import type { Logger } from "pino";

import {
  POST_VIEW_LOCK_NAMESPACE,
  POST_VIEW_LOCK_TTL_SECONDS,
} from "./constants";

function lockKey(postId: string, viewerKey: string) {
  return `${POST_VIEW_LOCK_NAMESPACE}:${postId}:${viewerKey}`;
}

export async function acquirePostViewLock(
  postId: string,
  viewerKey: string | null,
  ttlSeconds: number = POST_VIEW_LOCK_TTL_SECONDS,
  log?: Logger
): Promise<boolean> {
  if (!postId || !viewerKey) {
    return false;
  }

  try {
    const result = await redis.set(lockKey(postId, viewerKey), "1", {
      ex: ttlSeconds,
      nx: true,
    });
    return result === "OK";
  } catch (error) {
    log?.error({ postId, viewerKey, error }, "acquirePostViewLock failed");
    return false;
  }
}
