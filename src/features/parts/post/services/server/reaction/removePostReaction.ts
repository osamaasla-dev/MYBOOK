import { prisma } from "@/lib/prisma";

import { buildReactionSummary } from "../../../utils/reaction";

import type { RemovePostReactionParams, PostReactionResult } from "./types";

export async function removePostReaction({
  postId,
  userId,
}: RemovePostReactionParams): Promise<PostReactionResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.postReaction.findFirst({
      where: { postId, userId },
    });

    if (existing) {
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

    await tx.post.update({
      where: { id: postId },
      data: {
        reactionsCount: summary.reactionsCount,
        reactionSummary: summary.reactionSummary,
      },
    });

    return {
      reaction: null,
      operation: "removed",
      ...summary,
    } satisfies PostReactionResult;
  });
}
