import { redis } from "@/lib/redis";

import {
  RANKED_POST_IDS_CACHE_NAMESPACE,
  RANKED_POSTS_CACHE_TTL_SECONDS,
} from "./constants";
import type { RankedPostsCacheRecord } from "./types";

function cacheKey(viewerId: string) {
  return `${RANKED_POST_IDS_CACHE_NAMESPACE}:${viewerId}`;
}

export async function readRankedPostsCache(
  viewerId: string
): Promise<RankedPostsCacheRecord | null> {
  if (!viewerId) return null;

  try {
    const record = await redis.get<RankedPostsCacheRecord>(cacheKey(viewerId));
    return record ?? null;
  } catch (error) {
    console.error("ranked posts cache read failed", error);
    return null;
  }
}

export async function writeRankedPostsCache(
  viewerId: string,
  postsIds: string[]
) {
  if (!viewerId) return;

  const payload: RankedPostsCacheRecord = {
    storedAt: Date.now(),
    postsIds,
  };

  try {
    await redis.set(cacheKey(viewerId), payload, {
      ex: RANKED_POSTS_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("ranked posts cache write failed", error);
  }
}

export async function clearRankedPostsCache(viewerId: string) {
  if (!viewerId) return;
  try {
    await redis.del(cacheKey(viewerId));
  } catch (error) {
    console.error("ranked posts cache clear failed", error);
  }
}
