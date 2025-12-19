"use client";

import type { PostReactionType } from "../../constants/reactions";
import type { ReactionSummary } from "../../utils/reaction";

export function updateReactionSummary(
  summary: ReactionSummary | null | undefined,
  nextReaction: PostReactionType | null,
  previousReaction: PostReactionType | null
): ReactionSummary {
  const updated: ReactionSummary = { ...(summary ?? {}) };

  if (previousReaction) {
    updated[previousReaction] = Math.max(
      0,
      (updated[previousReaction] ?? 1) - 1
    );
  }

  if (nextReaction) {
    updated[nextReaction] = (updated[nextReaction] ?? 0) + 1;
  }

  return updated;
}

export function calculateReactionsCount(
  summary: ReactionSummary | null | undefined
): number {
  if (!summary) return 0;
  return Object.values(summary).reduce((total, count) => total + count, 0);
}
