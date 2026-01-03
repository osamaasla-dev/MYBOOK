import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/ratelimit";

import {
  POST_COMMENT_EVENT,
  type PostCommentEventPayload,
} from "../../events/postCommentEvent";
import { postRealtimeLogger } from "./logger";

export type BroadcastPostCommentInput = PostCommentEventPayload & {
  postAuthorId: string;
};

export async function broadcastPostCommentEvent({
  postAuthorId,
  ...payload
}: BroadcastPostCommentInput) {
  const { postId, commentAuthorId } = payload;

  const log = postRealtimeLogger.child({
    func: "broadcastPostCommentEvent",
    postId,
    commentAuthorId,
  });

  if (
    !postId ||
    !commentAuthorId ||
    !postAuthorId ||
    commentAuthorId === postAuthorId
  ) {
    log.warn("Skipping comment broadcast due to invalid inputs");
    return;
  }

  try {
    await pusherServer.trigger(
      buildUserChannel(postAuthorId),
      POST_COMMENT_EVENT,
      payload
    );
    log.debug("Broadcasted post comment event");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post comment event");
  }
}
