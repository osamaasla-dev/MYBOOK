import { prisma } from "@/lib/prisma";
import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking";

export async function buildViewerRelationshipMap(
  viewerId: string,
  authorIds: string[]
) {
  const relations = new Map<string, ViewerRelationshipSnapshot>();
  authorIds.forEach((authorId) => {
    relations.set(authorId, {
      isSelf: viewerId === authorId,
      isFriend: false,
      isFollower: false,
    });
  });

  if (!authorIds.length) {
    return relations;
  }

  const [friendships, followings] = await Promise.all([
    prisma.friend.findMany({
      where: {
        OR: [
          { userOneId: viewerId, userTwoId: { in: authorIds } },
          { userTwoId: viewerId, userOneId: { in: authorIds } },
        ],
      },
      select: { userOneId: true, userTwoId: true },
    }),
    prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: authorIds } },
      select: { followingId: true },
    }),
  ]);

  for (const friendship of friendships) {
    const friendId =
      friendship.userOneId === viewerId
        ? friendship.userTwoId
        : friendship.userOneId;
    const snapshot = relations.get(friendId);
    if (snapshot) {
      snapshot.isFriend = true;
    }
  }

  for (const follow of followings) {
    const snapshot = relations.get(follow.followingId);
    if (snapshot) {
      snapshot.isFollower = true;
    }
  }

  return relations;
}
