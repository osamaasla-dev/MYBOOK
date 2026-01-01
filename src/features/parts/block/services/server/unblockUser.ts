import { prisma } from "@/lib/prisma";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { clearImportantUsersCache } from "@/features/pages/home/utils/posts/user-ranking";
import { clearRankedPostsCache } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";
import { broadcastBlockEvent } from "@/features/parts/block/utils/server";
import type { ProfileUserRecord } from "@/features/pages/profile/types";

export type UnblockUserInput = {
  viewerId: string;
  viewerUsername?: string | null;
  targetProfile: Pick<ProfileUserRecord, "id" | "username">;
};

export type UnblockUserResult = {
  unblockedUserId: string;
};

export async function unblockUser({
  viewerId,
  viewerUsername,
  targetProfile,
}: UnblockUserInput): Promise<UnblockUserResult> {
  const targetUserId = targetProfile.id;

  await prisma.$transaction(async (tx) => {
    await tx.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: viewerId,
          blockedId: targetUserId,
        },
      },
    });

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
    event: "block:removed",
    kind: "unblocked",
    blockerId: viewerId,
    blockerUsername: viewerUsername,
    blockedId: targetUserId,
    blockedUsername: targetProfile.username,
  });

  return { unblockedUserId: targetUserId };
}
