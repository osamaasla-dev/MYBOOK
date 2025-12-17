import { prisma } from "@/lib/prisma";

import {
  buildReactionSummary,
  type ReactionOperation,
} from "../../../utils/reaction";
import {
  broadcastPostDetailMetaEvent,
  broadcastPostReactionEvent,
} from "../../../utils/realtime";
import {
  upsertPostReactionNotification,
  cancelPostReactionNotification,
} from "../reactionNotifications";

import type { PersistPostReactionParams, PostReactionResult } from "./types";

export async function persistPostReaction({
  postId,
  userId,
  reaction,
}: PersistPostReactionParams): Promise<PostReactionResult> {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.postReaction.findFirst({
      where: { postId, userId },
    });

    let currentReaction: PostReactionResult["reaction"] = reaction;
    let operation: ReactionOperation = "added";

    if (existing?.emoji === reaction) {
      await tx.postReaction.delete({ where: { id: existing.id } });
      currentReaction = null;
      operation = "removed";
    } else {
      if (existing) {
        await tx.postReaction.deleteMany({
          where: { postId, userId },
        });
        operation = "updated";
      } else {
        operation = "added";
      }

      await tx.postReaction.create({
        data: {
          postId,
          userId,
          emoji: reaction,
        },
      });
    }

    const aggregates = await tx.postReaction.groupBy({
      by: ["emoji"],
      where: { postId },
      _count: { _all: true },
    });

    const summary = buildReactionSummary(
      aggregates.map((item) => ({
        emoji: item.emoji,
        count: item._count._all,
      }))
    );

    const post = await tx.post.update({
      where: { id: postId },
      data: {
        reactionsCount: summary.reactionsCount,
        reactionSummary: summary.reactionSummary,
      },
      select: { authorId: true },
    });

    if (post?.authorId && post.authorId !== userId) {
      const reactor = await tx.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          username: true,
        },
      });

      if (currentReaction) {
        await upsertPostReactionNotification({
          postId,
          postAuthorId: post.authorId,
          reactorId: userId,
          reaction: currentReaction,
          reactorName: reactor?.name,
          reactorUsername: reactor?.username,
          tx,
        });
      } else {
        await cancelPostReactionNotification({
          postId,
          postAuthorId: post.authorId,
          reactorId: userId,
          tx,
        });
      }
    }

    return {
      reaction: currentReaction,
      operation,
      ...summary,
    } satisfies PostReactionResult;
  });

  const reactionForEvent = result.reaction ?? reaction;
  if (reactionForEvent) {
    const [post, reactor] = await Promise.all([
      prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    if (post?.authorId && post.authorId !== userId) {
      await broadcastPostReactionEvent({
        postId,
        reaction: reactionForEvent,
        reactorId: userId,
        reactorName: reactor?.name ?? "Someone",
        postAuthorId: post.authorId,
        operation: result.operation,
        reactionSummary: result.reactionSummary ?? null,
        reactionsCount: result.reactionsCount,
      });
    }
  }

  await broadcastPostDetailMetaEvent({
    postId,
    reactionsCount: result.reactionsCount,
    reactionSummary: result.reactionSummary ?? null,
  });

  return result;
}
