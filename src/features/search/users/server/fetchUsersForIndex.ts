import { prisma } from "@/lib/prisma";

type UserForIndex = Awaited<ReturnType<typeof fetchUsersForIndex>>[number];

export async function fetchUsersForIndex() {
  const users = await prisma.user.findMany({
    where: {
      isSuspended: false,
      deactivatedAt: null,
      OR: [
        { privacySetting: { searchVisibility: true } },
        { privacySetting: null },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      isPrivate: true,
      isVerified: true,
      followersCount: true,
      followingCount: true,
      friendsCount: true,
      createdAt: true,
    },
  });

  return users;
}

export type { UserForIndex };
