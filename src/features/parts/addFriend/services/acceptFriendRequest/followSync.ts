import type { Prisma } from "@prisma/client";

import type {
  FollowSyncResult,
  SyncMutualFollowsArgs,
  SyncParticipant,
} from "./followSync/types";
import { syncFollowDirection } from "./followSync/syncFollowDirection";

export async function syncMutualFollows(
  tx: Prisma.TransactionClient,
  participants: SyncMutualFollowsArgs & {
    viewer: SyncParticipant;
    requester: SyncParticipant;
  }
): Promise<FollowSyncResult[]> {
  const { viewer, requester } = participants;

  const viewerFollow = await syncFollowDirection(tx, {
    followerId: viewer.id,
    followerUsername: viewer.username,
    followerName: viewer.name,
    targetId: requester.id,
    targetUsername: requester.username,
    targetName: requester.name,
  });

  const requesterFollow = await syncFollowDirection(tx, {
    followerId: requester.id,
    followerUsername: requester.username,
    followerName: requester.name,
    targetId: viewer.id,
    targetUsername: viewer.username,
    targetName: viewer.name,
  });

  return [viewerFollow, requesterFollow];
}
