"use server";

import { prisma } from "@/lib/prisma";
import { ReactionState } from "@prisma/client";
import { commentMessages } from "@/lib/messages";
import {
  buildReactionSummary,
  ReactionOperation,
  type ReactionSummary,
} from "@/features/parts/post/utils/reaction";
import { CommentRouteError } from "../../../utils/server/comments";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import { isBlock } from "@/features/parts/block/utils/server";
import { validatePostAccess } from "../access";

export type RemoveCommentReactionParams = {
  commentId: string;
  postId: string;
  userId: string;
};

type CommentReactionResult = {
  reaction: PostReactionType | null;
  reactionsCount: number;
  parentId: string | null;
  reactionSummary: ReactionSummary;
  operation: ReactionOperation;
  commentAuthorId: string;
};

export async function removeCommentReaction({
  commentId,
  postId,
  userId,
}: RemoveCommentReactionParams): Promise<CommentReactionResult> {
  // Validate post access before processing
  const accessResult = await validatePostAccess({ postId, viewerId: userId });
  if (!accessResult) {
    throw new CommentRouteError(
      "Access denied: Cannot remove reaction from comment on this post",
      404
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Validate comment exists and get author info
    const comment = await tx.comment.findFirst({
      where: { id: commentId, postId, isDeleted: false },
      select: {
        id: true,
        parentId: true,
        authorId: true,
        reactionSummary: true,
        reactionsCount: true,
      },
    });

    if (!comment) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }

    const blockStatus = await isBlock(userId, comment.authorId);
    if (blockStatus.anyBlock) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }

    // 2. Get existing reaction if any
    const existing = await tx.commentReaction.findFirst({
      where: { commentId, userId, state: { not: ReactionState.CANCEL } },
    });

    let operation: ReactionOperation = "NOOP";

    // 3. If reaction exists, mark it as canceled
    if (existing) {
      await tx.commentReaction.update({
        where: { id: existing.id },
        data: {
          state: ReactionState.CANCEL,
          updatedAt: new Date(),
        },
      });
      operation = "CANCEL";
    }

    // 4. Get updated reaction summary (only active reactions)
    const aggregates = await tx.commentReaction.groupBy({
      by: ["emoji"],
      where: {
        commentId,
        state: { not: ReactionState.CANCEL },
      },
      _count: { _all: true },
    });

    const summary = buildReactionSummary(
      aggregates.map((item) => ({
        emoji: item.emoji,
        count: item._count._all,
      }))
    );

    // 5. Update comment with new reaction data
    await tx.comment.update({
      where: { id: commentId },
      data: {
        reactionsCount: summary.reactionsCount,
        reactionSummary: summary.reactionSummary,
      },
    });

    return {
      reaction: null,
      operation,
      ...summary,
      parentId: comment.parentId,
      commentAuthorId: comment.authorId,
    } satisfies CommentReactionResult;
  });

  return result;
}
