"use server";

import { logger } from "@/lib/logger";
import { commentMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";

import {
  buildCommentReactionFilter,
  type CommentReactionWhereInput,
} from "./filters";
import {
  queryCommentReactionList,
  queryCommentReactionSummary,
  queryCommentViewerReaction,
} from "./queries";
import { mapCommentReactionRecordToItem } from "./serializers";
import {
  type CommentReactionsResponse,
  type FetchCommentReactionsInput,
} from "./types";
import { MAX_COMMENT_REACTIONS_LIMIT } from "./schema";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";

export async function fetchCommentReactions({
  postId,
  commentId,
  tab,
  limit,
  cursor,
  viewerId,
  requestId,
  route,
}: FetchCommentReactionsInput): Promise<CommentReactionsResponse> {
  const log = logger.child({
    requestId: requestId ?? "comment-reactions:unknown",
    route: route ?? "features:postDetails:commentReactions",
  });

  log.info(
    { postId, commentId, tab, limit, cursor, viewerId },
    "fetchCommentReactions started"
  );

  const commentExists = await prisma.comment.findFirst({
    where: { id: commentId, postId, isDeleted: false },
    select: { id: true },
  });

  if (!commentExists) {
    log.warn(
      { postId, commentId },
      "Comment not found while fetching reactions"
    );
    throw new CommentRouteError(commentMessages.commentNotFound, 404);
  }

  const take = Math.min(Math.max(limit, 1), MAX_COMMENT_REACTIONS_LIMIT);

  const where: CommentReactionWhereInput = {
    commentId,
    ...buildCommentReactionFilter(tab),
    ...(viewerId
      ? {
          user: {
            blockedBy: {
              none: {
                blockerId: viewerId,
              },
            },
            blocks: {
              none: {
                blockedId: viewerId,
              },
            },
          },
        }
      : {}),
  };

  const [reactions, viewerReactionRecord, summaryRecord] = await Promise.all([
    queryCommentReactionList({ where, cursor, takePlusOne: take + 1 }),
    queryCommentViewerReaction(commentId, viewerId),
    queryCommentReactionSummary(commentId),
  ]);

  let nextCursor: string | null = null;
  if (reactions.length > take) {
    const nextItem = reactions.pop();
    nextCursor = nextItem?.id ?? null;
  }

  const items = reactions.map(mapCommentReactionRecordToItem);

  log.info(
    {
      postId,
      commentId,
      tab,
      count: items.length,
      hasNextPage: Boolean(nextCursor),
      viewerId,
    },
    "fetchCommentReactions completed"
  );

  return {
    items,
    nextCursor,
    hasNextPage: Boolean(nextCursor),
    reactionSummary:
      (summaryRecord?.reactionSummary as ReactionSummary | null) ?? null,
    viewerReaction: (viewerReactionRecord?.emoji as PostReactionType) ?? null,
  };
}
