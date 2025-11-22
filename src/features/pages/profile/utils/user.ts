import { prisma } from "@/lib/prisma";
import {
  cacheProfileNotFound,
  deleteProfileCache,
  isProfileNotFoundCached,
  readProfileCache,
  writeProfileCache,
} from "@/features/pages/profile/utils";

import type { ProfileUserRecord } from "../types";

export async function fetchProfileUserByUsername(
  username: string
): Promise<ProfileUserRecord | null> {
  const cached = await readProfileCache<ProfileUserRecord>(username);
  if (cached) {
    return cached;
  }

  const cachedMissing = await isProfileNotFoundCached(username);
  if (cachedMissing) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      websiteUrl: true,
      coverUrl: true,
      isPrivate: true,
      isVerified: true,
      followersCount: true,
      followingCount: true,
      postsCount: true,
      createdAt: true,
    },
  });

  if (user) {
    await writeProfileCache(username, user, { userId: user.id });
  }

  if (!user) {
    await cacheProfileNotFound(username);
  }

  return user;
}

export async function invalidateProfileCache(username: string) {
  await deleteProfileCache(username);
}
