import { prisma } from "@/lib/prisma";

import type { ViewerRelations } from "../types";

export async function resolveViewerRelations(
  viewerId: string | null,
  profileUserId: string
): Promise<ViewerRelations> {
  const isSelf = Boolean(viewerId && viewerId === profileUserId);

  if (!viewerId || isSelf) {
    return {
      isSelf,
      isFollowing: isSelf,
      isFollower: isSelf,
      isBlocked: false,
      hasPendingFollowRequest: false,
    };
  }

  const [
    followRecord,
    followerRecord,
    blockedByViewer,
    blockedByProfile,
    pendingRequest,
  ] = await Promise.all([
    prisma.follow.findFirst({
      where: { followerId: viewerId, followingId: profileUserId },
      select: { id: true },
    }),
    prisma.follow.findFirst({
      where: { followerId: profileUserId, followingId: viewerId },
      select: { id: true },
    }),
    prisma.block.findFirst({
      where: { blockerId: viewerId, blockedId: profileUserId },
      select: { id: true },
    }),
    prisma.block.findFirst({
      where: { blockerId: profileUserId, blockedId: viewerId },
      select: { id: true },
    }),
    prisma.followRequest.findFirst({
      where: {
        requesterId: viewerId,
        receiverId: profileUserId,
        status: "PENDING",
      },
      select: { id: true },
    }),
  ]);

  return {
    isSelf,
    isFollowing: Boolean(followRecord),
    isFollower: Boolean(followerRecord),
    isBlocked: Boolean(blockedByViewer || blockedByProfile),
    hasPendingFollowRequest: Boolean(pendingRequest),
  };
}
