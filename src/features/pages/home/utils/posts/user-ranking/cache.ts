import { redis } from "@/lib/redis";

import { CACHE_NAMESPACE, CACHE_TTL_SECONDS } from "./constants";
import type { ImportantUserScore } from "./types";

export type ImportantUsersCacheRecord = {
  storedAt: number;
  scores: ImportantUserScore[];
};

function cacheKey(userId: string) {
  return `${CACHE_NAMESPACE}:${userId}`;
}

export async function readImportantUsersCache(
  userId: string
): Promise<ImportantUsersCacheRecord | null> {
  if (!userId) return null;

  try {
    const record = await redis.get<ImportantUsersCacheRecord>(cacheKey(userId));
    return record ?? null;
  } catch (error) {
    console.error("important users cache read failed", error);
    return null;
  }
}

export async function writeImportantUsersCache(
  userId: string,
  scores: ImportantUserScore[]
) {
  if (!userId) return;

  const payload: ImportantUsersCacheRecord = {
    storedAt: Date.now(),
    scores,
  };

  try {
    await redis.set(cacheKey(userId), payload, {
      ex: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("important users cache write failed", error);
  }
}

export async function clearImportantUsersCache(userId: string) {
  if (!userId) return;
  try {
    await redis.del(cacheKey(userId));
  } catch (error) {
    console.error("important users cache clear failed", error);
  }
}
