import { prisma } from "@/lib/prisma";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { clearImportantUsersCache } from "@/features/pages/home/utils/posts/user-ranking";
import { clearRankedPostsCache } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { broadcastBlockEvent } from "@/features/parts/block/utils/server";
import type { ProfileUserRecord } from "@/features/pages/profile/types";
import { deleteFriendNotification } from "@/features/parts/addFriend/services/server";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";
import { deleteFollowNotification } from "@/features/parts/follow/services/server";

export type BlockUserInput = {
  viewerId: string;
  viewerUsername?: string | null;
  targetProfile: Pick<ProfileUserRecord, "id" | "username">;
};

export type BlockUserResult = {
  blockedUserId: string;
};

export async function blockUser({
  viewerId,
  viewerUsername,
  targetProfile,
}: BlockUserInput): Promise<BlockUserResult> {
  const targetUserId = targetProfile.id;

  await prisma.$transaction(async (tx) => {
    const block = await tx.block.create({
      data: {
        blockerId: viewerId,
        blockedId: targetUserId,
      },
    });

    const viewerFollowsTarget = await tx.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: targetUserId,
        },
      },
      select: { id: true },
    });

    if (viewerFollowsTarget) {
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: targetUserId,
          },
        },
      });

      await Promise.all([
        tx.user.update({
          where: { id: viewerId },
          data: { followingCount: { decrement: 1 } },
        }),
        tx.user.update({
          where: { id: targetUserId },
          data: { followersCount: { decrement: 1 } },
        }),
      ]);
    }

    const targetFollowsViewer = await tx.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: viewerId,
        },
      },
      select: { id: true },
    });

    if (targetFollowsViewer) {
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: viewerId,
          },
        },
      });

      await Promise.all([
        tx.user.update({
          where: { id: targetUserId },
          data: { followingCount: { decrement: 1 } },
        }),
        tx.user.update({
          where: { id: viewerId },
          data: { followersCount: { decrement: 1 } },
        }),
      ]);
    }

    const [userOneId, userTwoId] =
      viewerId < targetUserId
        ? [viewerId, targetUserId]
        : [targetUserId, viewerId];

    const existingFriendship = await tx.friend.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      select: { id: true },
    });

    if (existingFriendship) {
      await tx.friend.delete({
        where: {
          userOneId_userTwoId: {
            userOneId,
            userTwoId,
          },
        },
      });

      await Promise.all([
        tx.user.update({
          where: { id: viewerId },
          data: { friendsCount: { decrement: 1 } },
        }),
        tx.user.update({
          where: { id: targetUserId },
          data: { friendsCount: { decrement: 1 } },
        }),
      ]);
    }

    const followRequests = await tx.followRequest.findMany({
      where: {
        OR: [
          { requesterId: viewerId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: viewerId },
        ],
      },
      select: { id: true, notificationId: true },
    });

    if (followRequests.length) {
      for (const request of followRequests) {
        if (request.notificationId) {
          await deleteFollowNotification(tx, request.notificationId);
        }
      }

      await tx.followRequest.deleteMany({
        where: { id: { in: followRequests.map((request) => request.id) } },
      });
    }

    const friendRequests = await tx.friendRequest.findMany({
      where: {
        OR: [
          { requesterId: viewerId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: viewerId },
        ],
      },
      select: { id: true, notificationId: true },
    });

    if (friendRequests.length) {
      for (const request of friendRequests) {
        if (request.notificationId) {
          await deleteFriendNotification(tx, request.notificationId);
        }
      }

      await tx.friendRequest.deleteMany({
        where: { id: { in: friendRequests.map((request) => request.id) } },
      });
    }

    await adjustRelationshipSnapshot({
      actorId: viewerId,
      targetUserId,
      isFriend: false,
      isFollowing: false,
      prismaClient: tx,
    });

    await adjustRelationshipSnapshot({
      actorId: targetUserId,
      targetUserId: viewerId,
      isFriend: false,
      isFollowing: false,
      prismaClient: tx,
    });

    return block;
  });

  const cacheTasks: Promise<unknown>[] = [];
  for (const userId of [viewerId, targetUserId]) {
    cacheTasks.push(clearImportantUsersCache(userId));
    cacheTasks.push(clearRankedPostsCache(userId));
  }
  if (viewerUsername) {
    cacheTasks.push(invalidateProfileCache(viewerUsername));
  }
  if (targetProfile.username) {
    cacheTasks.push(invalidateProfileCache(targetProfile.username));
  }

  await Promise.all(cacheTasks);

  await broadcastBlockEvent({
    event: "block:created",
    kind: "blocked",
    blockerId: viewerId,
    blockerUsername: viewerUsername,
    blockedId: targetUserId,
    blockedUsername: targetProfile.username,
  });

  return { blockedUserId: targetUserId };
}
