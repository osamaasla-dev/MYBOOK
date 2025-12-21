import { pusherServer } from "@/lib/pusher/server";

import {
  POST_DETAIL_COMMENT_EVENT,
  POST_DETAIL_COMMENT_DELETED_EVENT,
  POST_DETAIL_META_EVENT,
  POST_DETAIL_REPLY_EVENT,
  POST_DETAIL_SHARE_EVENT,
  buildPostDetailChannel,
} from "./channels";
import type { ReactionSummary } from "../reaction";
import { postRealtimeLogger } from "./logger";

type BroadcastPostDetailCommentInput = {
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  contentPreview: string;
  contentHtml?: string | null;
  replyToId?: string | null;
  commentsCount: number;
};

export async function broadcastPostDetailCommentEvent(
  input: BroadcastPostDetailCommentInput
) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostDetailCommentEvent",
    postId: input.postId,
    commentId: input.commentId,
  });

  if (!input.postId || !input.commentId || !input.authorId) {
    log.warn("Skipping detail comment broadcast due to invalid inputs");
    return;
  }

  try {
    await pusherServer.trigger(
      buildPostDetailChannel(input.postId),
      input.replyToId ? POST_DETAIL_REPLY_EVENT : POST_DETAIL_COMMENT_EVENT,
      input
    );
    log.debug("Broadcasted post detail comment");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post detail comment");
  }
}

type BroadcastPostDetailShareInput = {
  postId: string;
  shareId: string;
  sharedById: string;
  sharedByName: string;
  channel: string;
  message?: string | null;
  sharesCount: number;
};

export async function broadcastPostDetailShareEvent(
  input: BroadcastPostDetailShareInput
) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostDetailShareEvent",
    postId: input.postId,
    shareId: input.shareId,
  });

  if (!input.postId || !input.shareId || !input.sharedById) {
    log.warn("Skipping detail share broadcast due to invalid inputs");
    return;
  }

  try {
    await pusherServer.trigger(
      buildPostDetailChannel(input.postId),
      POST_DETAIL_SHARE_EVENT,
      input
    );
    log.debug("Broadcasted post detail share");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post detail share");
  }
}

type BroadcastPostDetailMetaInput = {
  postId: string;
  commentsCount?: number;
  reactionsCount?: number;
  sharesCount?: number;
  latestActivityAt?: string;
  reactionSummary?: ReactionSummary | null;
};

export async function broadcastPostDetailMetaEvent(
  input: BroadcastPostDetailMetaInput
) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostDetailMetaEvent",
    postId: input.postId,
  });

  if (!input.postId) {
    log.warn("Skipping detail meta broadcast due to invalid inputs");
    return;
  }

  await pusherServer.trigger(
    buildPostDetailChannel(input.postId),
    POST_DETAIL_META_EVENT,
    input
  );
}

type BroadcastPostDetailCommentDeletedInput = {
  postId: string;
  commentId: string;
  parentId?: string | null;
};

export async function broadcastPostDetailCommentDeletedEvent(
  input: BroadcastPostDetailCommentDeletedInput
) {
  const log = postRealtimeLogger.child({
    func: "broadcastPostDetailCommentDeletedEvent",
    postId: input.postId,
    commentId: input.commentId,
  });

  if (!input.postId || !input.commentId) {
    log.warn("Skipping detail comment delete broadcast due to invalid inputs");
    return;
  }

  try {
    await pusherServer.trigger(
      buildPostDetailChannel(input.postId),
      POST_DETAIL_COMMENT_DELETED_EVENT,
      input
    );
    log.debug("Broadcasted post detail comment deletion");
  } catch (error) {
    log.error({ error }, "Failed to broadcast post detail comment deletion");
  }
}
