import { redis } from "@/lib/redis";

const PROFILE_CACHE_NAMESPACE = "profile:data";
const PROFILE_NOT_FOUND_NAMESPACE = "profile:notfound";
const PROFILE_USERNAME_HASH = "profile:usernames";
export const PROFILE_CACHE_TTL_SECONDS = 60; // 1 minute cache window
export const PROFILE_NOT_FOUND_TTL_SECONDS = 5; // negative cache window

export function profileCacheKey(username: string) {
  return `${PROFILE_CACHE_NAMESPACE}:${username.toLowerCase()}`;
}

function profileNotFoundKey(username: string) {
  return `${PROFILE_NOT_FOUND_NAMESPACE}:${username.toLowerCase()}`;
}

async function rememberProfileUsername(userId: string, username: string) {
  try {
    await redis.hset(PROFILE_USERNAME_HASH, {
      [userId]: username.toLowerCase(),
    });
  } catch (error) {
    console.error("profile username tracking failed", error);
  }
}

export async function forgetProfileUsername(userId: string) {
  try {
    await redis.hdel(PROFILE_USERNAME_HASH, userId);
  } catch (error) {
    console.error("profile username removal failed", error);
  }
}

export async function getTrackedProfileUsername(
  userId: string
): Promise<string | null> {
  try {
    return (await redis.hget<string>(PROFILE_USERNAME_HASH, userId)) ?? null;
  } catch (error) {
    console.error("profile username lookup failed", error);
    return null;
  }
}

export async function readProfileCache<T>(username: string): Promise<T | null> {
  try {
    return (await redis.get<T>(profileCacheKey(username))) ?? null;
  } catch (error) {
    console.error("profile cache read failed", error);
    return null;
  }
}

export async function isProfileNotFoundCached(
  username: string
): Promise<boolean> {
  try {
    const marker = await redis.get(profileNotFoundKey(username));
    return Boolean(marker);
  } catch (error) {
    console.error("profile not-found cache read failed", error);
    return false;
  }
}

export async function cacheProfileNotFound(
  username: string,
  ttlSeconds: number = PROFILE_NOT_FOUND_TTL_SECONDS
) {
  try {
    await redis.set(profileNotFoundKey(username), true, {
      ex: ttlSeconds,
    });
  } catch (error) {
    console.error("profile not-found cache write failed", error);
  }
}

export async function clearProfileNotFoundCache(username: string) {
  try {
    await redis.del(profileNotFoundKey(username));
  } catch (error) {
    console.error("profile not-found cache delete failed", error);
  }
}

type WriteProfileCacheOptions = {
  ttlSeconds?: number;
  userId?: string;
};

export async function writeProfileCache<T>(
  username: string,
  value: T,
  options: WriteProfileCacheOptions = {}
) {
  const ttlSeconds = options.ttlSeconds ?? PROFILE_CACHE_TTL_SECONDS;

  try {
    await redis.set(profileCacheKey(username), value, {
      ex: ttlSeconds,
    });

    // ensure stale negative cache is cleared
    await clearProfileNotFoundCache(username);

    if (options.userId) {
      await rememberProfileUsername(options.userId, username);
    }
  } catch (error) {
    console.error("profile cache write failed", error);
  }
}

export async function deleteProfileCaches(
  usernames: Iterable<string | null | undefined>
) {
  const keys = Array.from(
    new Set(
      Array.from(usernames)
        .filter((name): name is string => Boolean(name))
        .map((name) => profileCacheKey(name))
    )
  );

  if (!keys.length) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch (error) {
    console.error("profile cache invalidation failed", error);
  }
}

export async function deleteProfileCache(username: string) {
  await deleteProfileCaches([username]);
}

export async function invalidateProfileCacheByUserId(
  userId: string,
  options: { username?: string; removeStoredUsername?: boolean } = {}
) {
  const tracked = await getTrackedProfileUsername(userId);
  const usernames = new Set<string>();

  if (tracked) {
    usernames.add(tracked);
  }

  if (options.username) {
    usernames.add(options.username.toLowerCase());
  }

  if (usernames.size) {
    await deleteProfileCaches(usernames);
  }

  if (options.removeStoredUsername) {
    await forgetProfileUsername(userId);
  } else if (options.username) {
    await rememberProfileUsername(userId, options.username);
  }
}
