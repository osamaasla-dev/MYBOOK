import { prisma } from "@/lib/prisma";
import { ReactionState } from "@prisma/client";
import {
  buildReactionSummary,
  type ReactionOperation,
  type ReactionSummary,
} from "../../../utils/reaction";
import {
  broadcastPostDetailMetaEvent,
  broadcastPostMetaEvent,
  broadcastPostReactionEvent,
} from "../../../utils/realtime";
import { createPostReactionNotification } from "../reactionNotifications";
import { recordInteraction } from "@/features/parts/interaction/services";

import type { PersistPostReactionParams, PostReactionResult } from "./types";

export async function persistPostReaction({
  postId,
  userId,
  reaction,
}: PersistPostReactionParams): Promise<PostReactionResult> {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get post and existing reaction
    const post = await tx.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        reactionsCount: true,
        reactionSummary: true,
        commentsCount: true,
        sharesCount: true,
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const existingReaction = await tx.postReaction.findFirst({
      where: { postId, userId },
    });

    // 2. If same emoji, return early
    if (
      existingReaction?.emoji === reaction &&
      existingReaction.state !== ReactionState.CANCEL
    ) {
      return {
        reaction: existingReaction.emoji as PostReactionResult["reaction"],
        operation: "NOOP",
        reactionsCount: post.reactionsCount ?? 0,
        reactionSummary: (post.reactionSummary as ReactionSummary) ?? {},
        commentsCount: post.commentsCount ?? undefined,
        sharesCount: post.sharesCount ?? undefined,
      } satisfies PostReactionResult;
    }

    // 3. Determine operation type
    const operation: ReactionOperation = existingReaction ? "UPDATE" : "ADD";

    // 4. Upsert the reaction
    await tx.postReaction.upsert({
      where: {
        postId_userId: { postId, userId },
      },
      create: {
        postId,
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

    // 5. Get updated reaction summary
    const aggregates = await tx.postReaction.groupBy({
      by: ["emoji"],
      where: {
        postId,
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

    // 6. Update post with new reaction data
    const updatedPost = await tx.post.update({
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

    // 7. Create notification if needed
    if (
      updatedPost.authorId &&
      updatedPost.authorId !== userId &&
      operation === "ADD"
    ) {
      const reactor = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true },
      });

      await createPostReactionNotification({
        postId,
        postAuthorId: updatedPost.authorId,
        reactorId: userId,
        reaction,
        reactorName: reactor?.name,
        reactorUsername: reactor?.username,
        tx,
      });
    }

    return {
      reaction,
      operation,
      ...summary,
      commentsCount: updatedPost.commentsCount ?? undefined,
      sharesCount: updatedPost.sharesCount ?? undefined,
    } satisfies PostReactionResult;
  });

  // 8. Handle side effects after transaction
  if (
    (result.operation === "ADD" || result.operation === "UPDATE") &&
    result.reaction &&
    result.reactionsCount > 0
  ) {
    const postAuthor = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (postAuthor?.authorId && postAuthor.authorId !== userId) {
      const reactor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (result.operation === "ADD") {
        await recordInteraction({
          actorId: userId,
          targetUserId: postAuthor.authorId,
          type: "react",
        }).catch(console.error);
        void broadcastPostReactionEvent({
          postId,
          reaction: result.reaction,
          reactorId: userId,
          reactorName: reactor?.name ?? "Someone",
          postAuthorId: postAuthor.authorId,
          operation: "ADD",
        });
      }
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
          postAuthorId: postAuthor.authorId,
          initiatorId: userId,
          reactionsCount: result.reactionsCount,
          reactionSummary: result.reactionSummary,
          commentsCount: result.commentsCount,
          sharesCount: result.sharesCount,
        }),
      ]);
    }
  }

  return result;
}
