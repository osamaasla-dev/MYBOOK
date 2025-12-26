import type { Logger } from "pino";

import {
  broadcastPostCommentEvent,
  broadcastPostDetailCommentEvent,
  broadcastPostDetailMetaEvent,
  broadcastPostMetaEvent,
} from "@/features/parts/post/utils/realtime";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { CommentWithAuthor } from "@/features/parts/postDetails/services/server";

type BroadcastCommentEventsInput = {
  comment: CommentWithAuthor;
  postAuthorId: string;
  parentId: string | null;
  commentsCount: number;
  sharesCount: number;
  reactionSummary: ReactionSummary | null;
  log: Logger;
};

export async function broadcastCreateCommentEvents({
  comment,
  postAuthorId,
  parentId,
  commentsCount,
  sharesCount,
  reactionSummary,
  log,
}: BroadcastCommentEventsInput) {
  const authorName =
    comment.author.name ?? comment.author.username ?? "Someone";
  const contentPreview = comment.content.slice(0, 140);

  const ownerPayload = {
    postId: comment.postId,
    commentId: comment.id,
    commentAuthorId: comment.authorId,
    authorName,
    authorUsername: comment.author.username,
    authorAvatarUrl: comment.author.avatarUrl,
    contentPreview,
    replyToId: parentId,
    commentsCount,
  };

  const tasks = [
    {
      phase: "owner:comment",
      promise: broadcastPostCommentEvent({
        postAuthorId,
        ...ownerPayload,
      }),
    },
    {
      phase: "details:comment",
      promise: broadcastPostDetailCommentEvent({
        postId: comment.postId,
        commentId: comment.id,
        authorId: comment.authorId,
        authorName,
        authorUsername: comment.author.username,
        authorAvatarUrl: comment.author.avatarUrl,
        contentPreview,
        replyToId: parentId,
        commentsCount,
      }),
    },
    {
      phase: "owner:meta",
      promise: broadcastPostMetaEvent({
        postAuthorId,
        initiatorId: comment.authorId,
        postId: comment.postId,
        commentsCount,
        sharesCount,
        reactionSummary,
      }),
    },
    {
      phase: "details:meta",
      promise: broadcastPostDetailMetaEvent({
        postId: comment.postId,
        initiatorId: comment.authorId,
        commentsCount,
        sharesCount,
        reactionSummary,
      }),
    },
  ];

  const results = await Promise.allSettled(tasks.map((task) => task.promise));

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      log.error(
        { error: result.reason, phase: tasks[index]?.phase },
        "Failed to broadcast comment event"
      );
    }
  });
}
