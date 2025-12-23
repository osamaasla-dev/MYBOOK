import { prisma } from "@/lib/prisma";
import { ReactionState } from "@prisma/client";
import { buildReactionSummary } from "../../../utils/reaction";
import {
  broadcastPostDetailMetaEvent,
  broadcastPostMetaEvent,
} from "../../../utils/realtime";
import { applyNegativeSignal } from "@/features/parts/interaction/services";

import type { RemovePostReactionParams, PostReactionResult } from "./types";

export async function removePostReaction({
  postId,
  userId,
}: RemovePostReactionParams): Promise<PostReactionResult> {
  const { result, removedReaction, postAuthorId } = await prisma.$transaction(
    async (tx) => {
      // 1. Find existing active reaction
      const existing = await tx.postReaction.findFirst({
        where: {
          postId,
          userId,
          state: { not: ReactionState.CANCEL }, // Only find non-canceled reactions
        },
      });

      let removedReaction: string | null = null;
      let operation: "CANCEL" | "NOOP" = "NOOP";

      if (existing) {
        // 2. Instead of deleting, mark as CANCEL
        await tx.postReaction.update({
          where: { id: existing.id },
          data: {
            state: ReactionState.CANCEL,
            updatedAt: new Date(),
          },
        });
        removedReaction = existing.emoji;
        operation = "CANCEL";
      }

      // 3. Get updated reaction summary (only active reactions)
      const aggregates = await tx.postReaction.groupBy({
        by: ["emoji"],
        where: {
          postId,
          state: { not: ReactionState.CANCEL }, // Only count non-canceled reactions
        },
        _count: { _all: true },
      });

      const summary = buildReactionSummary(
        aggregates.map((item) => ({
          emoji: item.emoji,
          count: item._count._all,
        }))
      );

      // 4. Update post with new reaction data
      const post = await tx.post.update({
        where: { id: postId },
        data: {
          reactionsCount: summary.reactionsCount,
          reactionSummary: summary.reactionSummary,
        },
        select: {
          authorId: true,
          commentsCount: true,
          sharesCount: true,
        },
      });

      return {
        result: {
          reaction: null,
          operation,
          ...summary,
          commentsCount: post.commentsCount ?? undefined,
          sharesCount: post.sharesCount ?? undefined,
        } satisfies PostReactionResult,
        removedReaction,
        postAuthorId: post.authorId,
      };
    }
  );

  // 5. Handle side effects after transaction
  if (removedReaction && postAuthorId && postAuthorId !== userId) {
    await applyNegativeSignal({
      actorId: userId,
      targetUserId: postAuthorId,
      type: "unreact",
    }).catch((error) => {
      console.warn("Failed to apply negative signal for reaction removal", {
        error,
        actorId: userId,
        targetUserId: postAuthorId,
      });
    });

    // Broadcast events
    await Promise.allSettled([
      broadcastPostDetailMetaEvent({
        postId,
        reactionsCount: result.reactionsCount,
        reactionSummary: result.reactionSummary,
        commentsCount: result.commentsCount,
        sharesCount: result.sharesCount,
      }),
      broadcastPostMetaEvent({
        postId,
        postAuthorId,
        initiatorId: userId,
        reactionsCount: result.reactionsCount,
        reactionSummary: result.reactionSummary,
        commentsCount: result.commentsCount,
        sharesCount: result.sharesCount,
      }),
    ]);
  }

  return result;
}
