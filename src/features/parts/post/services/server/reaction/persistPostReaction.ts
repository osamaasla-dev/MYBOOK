import { prisma } from "@/lib/prisma";

import {
  buildReactionSummary,
  type ReactionOperation,
} from "../../../utils/reaction";

import type { PersistPostReactionParams, PostReactionResult } from "./types";

export async function persistPostReaction({
  postId,
  userId,
  reaction,
}: PersistPostReactionParams): Promise<PostReactionResult> {
  return prisma.$transaction(async (tx) => {
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

    await tx.post.update({
      where: { id: postId },
      data: {
        reactionsCount: summary.reactionsCount,
        reactionSummary: summary.reactionSummary,
      },
    });

    return {
      reaction: currentReaction,
      operation,
      ...summary,
    } satisfies PostReactionResult;
  });
}
