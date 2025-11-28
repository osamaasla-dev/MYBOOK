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
    targetId: requester.id,
    targetUsername: requester.username,
  });

  const requesterFollow = await syncFollowDirection(tx, {
    followerId: requester.id,
    followerUsername: requester.username,
    targetId: viewer.id,
    targetUsername: viewer.username,
  });

  return [viewerFollow, requesterFollow];
}
