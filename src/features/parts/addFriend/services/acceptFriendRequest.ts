import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";

import { handleFriendRequestAcceptance } from "./acceptFriendRequest/friendRequestHandler";
import { createFriendRecord } from "./acceptFriendRequest/friendRecordCreator";
import { syncMutualFollows } from "./acceptFriendRequest/followSync";
import { broadcastAcceptanceEvents } from "./acceptFriendRequest/eventsBroadcaster";

export type AcceptFriendRequestInput = {
  viewerId: string;
  viewerUsername: string;
  requesterId: string;
  requesterUsername: string;
};

export async function acceptFriendRequest({
  viewerId,
  viewerUsername,
  requesterId,
  requesterUsername,
}: AcceptFriendRequestInput) {
  if (viewerId === requesterId) {
    throw new Error(friendMessages.FRIEND_ERRORS.selfFriend);
  }

  let followSyncResults = [] as Awaited<ReturnType<typeof syncMutualFollows>>;
  let friendRequestId = "";

  await prisma.$transaction(async (tx) => {
    const { requestId } = await handleFriendRequestAcceptance(tx, {
      viewerId,
      viewerUsername,
      requesterId,
      requesterUsername,
    });

    friendRequestId = requestId;

    await createFriendRecord(tx, viewerId, requesterId);

    followSyncResults = await syncMutualFollows(tx, {
      viewer: { id: viewerId, username: viewerUsername },
      requester: { id: requesterId, username: requesterUsername },
    });
  });

  await broadcastAcceptanceEvents({
    viewerId,
    viewerUsername,
    requesterId,
    requesterUsername,
    followResults: followSyncResults,
    friendRequestId,
  });

  return {
    status: "ACCEPTED" as const,
    requestId: friendRequestId,
  };
}
