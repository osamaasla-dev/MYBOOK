import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";
import { broadcastRemovalEvents } from "./unFriend/eventsBroadcaster";
import { handleFriendRemoval } from "./unFriend/unFriendHandler";
import { cleanupFollowRelations } from "./unFriend/followCleanupHandler";

export type UnFriendInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function unFriend({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: UnFriendInput) {
  if (viewerId === targetUserId) {
    throw new Error(friendMessages.FRIEND_ERRORS.selfFriend);
  }

  const context = { viewerId, viewerUsername, targetUserId, targetUsername };

  const followResult = await prisma.$transaction(async (tx) => {
    await handleFriendRemoval(tx, context);
    return cleanupFollowRelations(tx, context);
  });

  await broadcastRemovalEvents({
    ...context,
    followResult,
  });

  return {
    status: "REMOVED" as const,
  };
}
