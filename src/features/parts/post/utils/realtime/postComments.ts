import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";

import { POST_COMMENT_EVENT } from "../../events/postCommentEvent";
import type { ReactionSummary } from "../reaction";
import { postRealtimeLogger } from "./logger";

type PostCommentOwnerEventPayload = {
  postId: string;
  commentAuthorId: string;
  reactionSummary: ReactionSummary | null;
};

export type BroadcastPostCommentInput = PostCommentOwnerEventPayload & {
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
