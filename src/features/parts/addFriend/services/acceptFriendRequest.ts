import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";

import { handleFriendRequestAcceptance } from "./acceptFriendRequest/friendRequestHandler";
import { createFriendRecord } from "./acceptFriendRequest/friendRecordCreator";
import { syncMutualFollows } from "./acceptFriendRequest/followSync";
import { broadcastAcceptanceEvents } from "./acceptFriendRequest/eventsBroadcaster";

export type AcceptFriendRequestInput = {
  viewerId: string;
  viewerUsername: string;
  viewerName: string;
  requesterId: string;
  requesterUsername: string;
  requesterName: string;
};

export async function acceptFriendRequest({
  viewerId,
  viewerUsername,
  viewerName,
  requesterId,
  requesterUsername,
  requesterName,
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
      viewer: { id: viewerId, username: viewerUsername, name: viewerName },
      requester: {
        id: requesterId,
        username: requesterUsername,
        name: requesterName,
      },
    });
  });

  await broadcastAcceptanceEvents({
    viewerId,
    viewerUsername,
    viewerName,
    requesterId,
    requesterUsername,
    requesterName,
    followResults: followSyncResults,
    friendRequestId,
  });

  return {
    status: "ACCEPTED" as const,
    requestId: friendRequestId,
  };
}
