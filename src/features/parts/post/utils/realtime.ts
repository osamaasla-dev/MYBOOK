import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";

const POST_CREATED_EVENT = "post:created";

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
  if (!postId || !authorId || !recipientIds.length) return;

  const payload = {
    event: POST_CREATED_EVENT,
    postId,
    authorId,
    authorName,
  };

  const triggers = recipientIds.map((recipientId) =>
    pusherServer.trigger(
      buildUserChannel(recipientId),
      POST_CREATED_EVENT,
      payload
    )
  );

  await Promise.allSettled(triggers);
}
