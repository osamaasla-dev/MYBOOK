import { prisma } from "@/lib/prisma";

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
import { upsertPostReactionNotification } from "../reactionNotifications";
import { recordInteraction } from "@/features/parts/interaction/services";

import type { PersistPostReactionParams, PostReactionResult } from "./types";

export async function persistPostReaction({
  postId,
  userId,
  reaction,
}: PersistPostReactionParams): Promise<PostReactionResult> {
  let postAuthorId: string | null = null;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.postReaction.findFirst({
      where: { postId, userId },
    });

    const currentReaction: PostReactionResult["reaction"] = reaction;
    let operation: ReactionOperation = "added";

    if (existing?.emoji === reaction) {
      operation = "noop";
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: {
          authorId: true,
          reactionsCount: true,
          reactionSummary: true,
        },
      });
      postAuthorId = post?.authorId ?? null;

      return {
        reaction: existing.emoji as PostReactionResult["reaction"],
        operation,
        reactionsCount: post?.reactionsCount ?? 0,
        reactionSummary:
          (post?.reactionSummary as ReactionSummary | null) ?? {},
      } satisfies PostReactionResult;
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
      select: {
        authorId: true,
        commentsCount: true,
        sharesCount: true,
      },
    });
    postAuthorId = post?.authorId ?? null;

    if (postAuthorId && postAuthorId !== userId) {
      const reactor = await tx.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          username: true,
        },
      });

      await upsertPostReactionNotification({
        postId,
        postAuthorId,
        reactorId: userId,
        reaction: currentReaction,
        reactorName: reactor?.name,
        reactorUsername: reactor?.username,
        tx,
      });
    }

    return {
      reaction: currentReaction,
      operation,
      ...summary,
      commentsCount: post?.commentsCount ?? undefined,
      sharesCount: post?.sharesCount ?? undefined,
    } satisfies PostReactionResult;
  });

  if (
    (result.operation === "added" || result.operation === "updated") &&
    postAuthorId &&
    postAuthorId !== userId
  ) {
    void recordInteraction({
      actorId: userId,
      targetUserId: postAuthorId,
      type: "react",
    }).catch((error) => {
      console.warn("Failed to record reaction interaction", {
        error,
        actorId: userId,
        targetUserId: postAuthorId,
      });
    });
  }

  if (
    result.operation !== "noop" &&
    result.reaction &&
    postAuthorId &&
    postAuthorId !== userId
  ) {
    const reactor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await broadcastPostReactionEvent({
      postId,
      reaction: result.reaction,
      reactorId: userId,
      reactorName: reactor?.name ?? "Someone",
      postAuthorId,
      operation: result.operation,
    });
  }

  if (result.operation !== "noop") {
    const metaPayload = {
      postId,
      reactionsCount: result.reactionsCount,
      reactionSummary: result.reactionSummary ?? null,
      commentsCount: result.commentsCount ?? undefined,
      sharesCount: result.sharesCount ?? undefined,
    };
    await Promise.allSettled([
      broadcastPostDetailMetaEvent(metaPayload),
      postAuthorId && postAuthorId !== userId
        ? broadcastPostMetaEvent({
            postAuthorId,
            initiatorId: userId,
            ...metaPayload,
          })
        : null,
    ]);
  }

  return result;
}
