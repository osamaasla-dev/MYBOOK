import { prisma } from "@/lib/prisma";

import { getRequestLog } from "@/lib/request-log";

import { INTERACTION_WEIGHTS } from "./constants";
import { incrementTotalInteractedUsers } from "./helpers";
import type { AdjustRelationshipSnapshotInput } from "./types";

export async function adjustRelationshipSnapshot({
  actorId,
  targetUserId,
  isFriend,
  isFollowing,
  prismaClient,
}: AdjustRelationshipSnapshotInput) {
  const client = prismaClient ?? prisma;
  const { log } = await getRequestLog({
    route: "interaction:relationshipSnapshot",
  });
  if (!actorId || !targetUserId) {
    log.warn("adjustRelationshipSnapshot missing actor or target");
    return;
  }
  if (actorId === targetUserId) {
    log.warn({ actorId }, "adjustRelationshipSnapshot actor equals target");
    return;
  }
  if (typeof isFriend !== "boolean" && typeof isFollowing !== "boolean") {
    log.warn("adjustRelationshipSnapshot requires at least one boolean flag");
    return;
  }

  const existing = await client.userInteractionStats.findUnique({
    where: {
      userId_targetUserId: {
        userId: actorId,
        targetUserId,
      },
    },
    select: {
      isFriend: true,
      isFollowing: true,
    },
  });

  const timestamp = new Date();

  const currentFriend = existing?.isFriend ?? false;
  const currentFollowing = existing?.isFollowing ?? false;

  const friendDelta =
    typeof isFriend === "boolean" && isFriend !== currentFriend
      ? isFriend
        ? INTERACTION_WEIGHTS.friend
        : INTERACTION_WEIGHTS.unfriend
      : 0;
  const followDelta =
    typeof isFollowing === "boolean" && isFollowing !== currentFollowing
      ? isFollowing
        ? INTERACTION_WEIGHTS.follow
        : INTERACTION_WEIGHTS.unfollow
      : 0;
  const weightDelta = friendDelta + followDelta;
  log.info(
    {
      actorId,
      targetUserId,
      isFriend,
      isFollowing,
      friendDelta,
      followDelta,
      weightDelta,
    },
    "adjustRelationshipSnapshot"
  );

  const result = await client.userInteractionStats.upsert({
    where: {
      userId_targetUserId: {
        userId: actorId,
        targetUserId,
      },
    },
    update: {
      ...(typeof isFriend === "boolean" ? { isFriend } : {}),
      ...(typeof isFollowing === "boolean" ? { isFollowing } : {}),
      ...(weightDelta
        ? {
            interactionWeight: { increment: weightDelta },
            ...(weightDelta > 0 ? { lastInteractionAt: timestamp } : {}),
          }
        : {}),
    },
    create: {
      userId: actorId,
      targetUserId,
      isFriend: Boolean(isFriend),
      isFollowing: Boolean(isFollowing),
      interactionWeight:
        (isFriend ? INTERACTION_WEIGHTS.friend : 0) +
        (isFollowing ? INTERACTION_WEIGHTS.follow : 0),
      lastInteractionAt:
        (isFriend ? INTERACTION_WEIGHTS.friend : 0) +
        (isFollowing ? INTERACTION_WEIGHTS.follow : 0)
          ? timestamp
          : null,
    },
  });

  if (!existing && result) {
    await incrementTotalInteractedUsers(client, actorId);
  }
}
