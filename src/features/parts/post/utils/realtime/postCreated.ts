import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";

import { POST_CREATED_EVENT } from "./channels";
import { postRealtimeLogger } from "./logger";

export type BroadcastPostCreatedInput = {
  postId: string;
  authorId: string;
  authorName: string;
  recipientIds: string[];
};

export async function broadcastPostCreatedEvent({
  postId,
  authorId,
  authorName,
  recipientIds,
}: BroadcastPostCreatedInput) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostCreatedEvent",
    postId,
    authorId,
  });

  if (!postId || !authorId || !recipientIds?.length) {
    log.warn("Skipping broadcast due to missing identifiers");
    return;
  }

  const payload = {
    event: POST_CREATED_EVENT,
    postId,
    authorId,
    authorName,
  };

  try {
    const triggers = recipientIds.map((recipientId) =>
      pusherServer.trigger(
        buildUserChannel(recipientId),
        POST_CREATED_EVENT,
        payload
      )
    );

    await Promise.allSettled(triggers);
    log.debug({ recipients: recipientIds.length }, "Broadcasted post creation");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post creation");
  }
}
