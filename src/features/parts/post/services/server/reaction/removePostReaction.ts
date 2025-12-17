import { prisma } from "@/lib/prisma";

import { buildReactionSummary } from "../../../utils/reaction";
import {
  broadcastPostDetailMetaEvent,
  broadcastPostReactionEvent,
} from "../../../utils/realtime";
import type { PostReactionType } from "../../../constants/reactions";
import { cancelPostReactionNotification } from "../reactionNotifications";

import type { RemovePostReactionParams, PostReactionResult } from "./types";

export async function removePostReaction({
  postId,
  userId,
}: RemovePostReactionParams): Promise<PostReactionResult> {
  const { result, removedReaction, postAuthorId } = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.postReaction.findFirst({
        where: { postId, userId },
      });

      let removedReaction: PostReactionType | null = null;

      if (existing) {
        removedReaction = existing.emoji as PostReactionType;
        await tx.postReaction.delete({ where: { id: existing.id } });
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

      const postAuthorId = post?.authorId ?? null;
      if (postAuthorId && postAuthorId !== userId && removedReaction) {
        await cancelPostReactionNotification({
          postId,
          postAuthorId,
          reactorId: userId,
          tx,
        });
      }

      return {
        result: {
          reaction: null,
          operation: "removed",
          ...summary,
        } satisfies PostReactionResult,
        removedReaction,
        postAuthorId,
      };
    }
  );

  if (removedReaction && postAuthorId && postAuthorId !== userId) {
    const reactor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await broadcastPostReactionEvent({
      postId,
      reaction: removedReaction,
      reactorId: userId,
      reactorName: reactor?.name ?? "Someone",
      postAuthorId,
      operation: "removed",
      reactionSummary: result.reactionSummary ?? null,
      reactionsCount: result.reactionsCount,
    });
  }

  await broadcastPostDetailMetaEvent({
    postId,
    reactionsCount: result.reactionsCount,
    reactionSummary: result.reactionSummary ?? null,
  });

  return result;
}
