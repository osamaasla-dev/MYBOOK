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

type PersistCommentReactionParams = {
  commentId: string;
  postId: string;
  userId: string;
  reaction: PostReactionType;
};

type CommentReactionResult = {
  reaction: PostReactionType | null;
  reactionsCount: number;
  reactionSummary: ReactionSummary;
  operation: ReactionOperation;
  commentAuthorId: string;
  parentId: string | null;
};

export async function persistCommentReaction({
  commentId,
  postId,
  userId,
  reaction,
}: PersistCommentReactionParams): Promise<CommentReactionResult> {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Validate comment exists and get author info
    const comment = await tx.comment.findFirst({
      where: { id: commentId, postId, isDeleted: false },
      select: {
        id: true,
        parentId: true,
        reactionSummary: true,
        reactionsCount: true,
        authorId: true,
      },
    });

    if (!comment) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }

    // 2. Get existing reaction if any
    const existingReaction = await tx.commentReaction.findFirst({
      where: { commentId, userId },
    });
    if (
      existingReaction?.emoji === reaction &&
      existingReaction.state !== ReactionState.CANCEL
    ) {
      return {
        reaction: existingReaction.emoji,
        parentId: comment.parentId,
        operation: "NOOP",
        reactionsCount: comment.reactionsCount,
        reactionSummary: comment.reactionSummary as ReactionSummary,
        commentAuthorId: comment.authorId,
      } satisfies CommentReactionResult;
    }
    // 3. Determine operation type
    const operation = existingReaction
      ? ReactionState.UPDATE
      : ReactionState.ADD;

    // 4. Upsert the reaction
    await tx.commentReaction.upsert({
      where: {
        commentId_userId: { commentId, userId },
      },
      create: {
        commentId,
        userId,
        emoji: reaction,
        state: ReactionState.ADD,
      },
      update: {
        emoji: reaction,
        state: ReactionState.UPDATE,
        updatedAt: new Date(),
      },
    });

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

    // 7. Update comment with new reaction data
    await tx.comment.update({
      where: { id: commentId },
      data: {
        reactionsCount: summary.reactionsCount,
        reactionSummary: summary.reactionSummary,
      },
    });

    return {
      reaction,
      operation,
      ...summary,
      parentId: comment.parentId,
      commentAuthorId: comment.authorId,
    } satisfies CommentReactionResult;
  });

  return result;
}
