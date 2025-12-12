import { useMemo } from "react";

import {
  isValidPostReactionType,
  reactionTypeToEmoji,
} from "../../constants/reactions";
import type { ReactionSummary } from "../../utils/reaction";
import type { PostStats } from "./types";
import { formatCount } from "./utils";

type PostReactionSummaryProps = {
  stats?: PostStats;
  optimisticSummary?: ReactionSummary | null;
};

export function PostReactionSummary({
  stats,
  optimisticSummary,
}: PostReactionSummaryProps) {
  const chips = useMemo(() => {
    if (!optimisticSummary) return [];

    return Object.entries(optimisticSummary)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }, [optimisticSummary]);

  if (chips.length === 0) {
    if (typeof stats?.reactions !== "number") return null;
    return (
      <span className="inline-flex items-center gap-1">
        <span>{stats.reactionsEmoji ?? "👍"}</span>
        <span>{formatCount(stats.reactions)}</span>
      </span>
    );
  }

  return (
    <>
      {chips.map(({ emoji, count }) => {
        const displayEmoji = isValidPostReactionType(emoji)
          ? reactionTypeToEmoji(emoji)
          : emoji;

        return (
          <span
            key={emoji}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${"border-border/60"}`}
          >
            <span aria-hidden="true">{displayEmoji}</span>
            <span className="font-semibold">{formatCount(count)}</span>
          </span>
        );
      })}
    </>
  );
}
