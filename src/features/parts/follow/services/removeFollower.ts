import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "../utils";

export type RemoveFollowerInput = {
  viewerId: string;
  viewerUsername: string;
  followerId: string;
  followerUsername: string;
};

export async function removeFollower({
  viewerId,
  viewerUsername,
  followerId,
  followerUsername,
}: RemoveFollowerInput) {
  if (viewerId === followerId) {
    throw new Error(followMessages.FOLLOW_ERRORS.selfFollow);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: viewerId,
          },
        },
      });

      await tx.user.update({
        where: { id: viewerId },
        data: { followersCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(followMessages.FOLLOW_ERRORS.notFollowing);
    }

    throw error;
  }

  await Promise.all([
    invalidateProfileCache(viewerUsername),
    invalidateProfileCache(followerUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:removed",
    followerId,
    followerUsername,
    targetId: viewerId,
    targetUsername: viewerUsername,
    kind: "unfollow",
    followersDelta: -1,
  });

  await broadcastFollowEvent({
    event: "follower:removed",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: followerId,
    targetUsername: followerUsername,
    kind: "follower-removed",
    followersDelta: 0,
  });

  return {
    status: "REMOVED" as const,
  };
}
