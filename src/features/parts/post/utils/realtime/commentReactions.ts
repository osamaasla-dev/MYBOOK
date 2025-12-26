import { pusherServer } from "@/lib/pusher/server";
import { buildUserChannel } from "@/features/utils/realtime";

import { postRealtimeLogger } from "./logger";
import type { PostReactionType } from "../../constants/reactions";
import {
  POST_COMMENT_REACTION_EVENT,
  type CommentReactionEventPayload,
} from "../../events/commentReactionEvent";
import { ReactionOperation } from "../reaction";

export type BroadcastCommentReactionInput = {
  postId: string;
  commentId: string;
  commentAuthorId: string;
  viewerId: string;
  viewerName: string;
  reaction: PostReactionType;
  parentId: string | null;
  reactorName: string;
  operation: ReactionOperation;
};

export async function broadcastCommentReactionEvent(
  input: BroadcastCommentReactionInput
) {
  const log = postRealtimeLogger.child({
    func: "broadcastCommentReactionEvent",
    postId: input.postId,
    commentId: input.commentId,
    viewerId: input.viewerId,
  });

  if (
    !input.postId ||
    !input.commentId ||
    !input.viewerId ||
    !input.commentAuthorId ||
    input.commentAuthorId === input.viewerId
  ) {
    log.warn("Skipping comment reaction broadcast due to invalid inputs");
    return;
  }

  const payload: CommentReactionEventPayload = {
    postId: input.postId,
    commentId: input.commentId,
    reaction: input.reaction,
    reactorId: input.viewerId,
    reactorName: input.viewerName,
    operation: input.operation,
    parentId: input.parentId,
  };

  await pusherServer.trigger(
    buildUserChannel(input.commentAuthorId),
    POST_COMMENT_REACTION_EVENT,
    payload
  );
}
