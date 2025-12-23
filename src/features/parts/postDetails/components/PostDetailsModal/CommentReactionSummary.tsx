"use client";

import { useMemo } from "react";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import {
  isValidPostReactionType,
  reactionTypeToEmoji,
} from "@/features/parts/post/constants/reactions";
import { calculateReactionsCount } from "@/features/parts/post/hooks/utils/reactionSummary";
import { formatCount } from "@/features/parts/post/components/PostCard/utils";

type CommentReactionSummaryProps = {
  summary: ReactionSummary | null;
  reactionsCount?: number;
  onClick?: () => void;
};

export function CommentReactionSummary({
  summary,
  reactionsCount,
  onClick,
}: CommentReactionSummaryProps) {
  const { total, topEmojis } = useMemo(() => {
    if (!summary) {
      return { total: reactionsCount ?? 0, topEmojis: [] as string[] };
    }

    const chips = Object.entries(summary)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([emoji]) => emoji);

    const totalReactions =
      reactionsCount ?? calculateReactionsCount(summary) ?? 0;
    return { total: totalReactions, topEmojis: chips.slice(0, 3) };
  }, [summary, reactionsCount]);

  if (!total) {
    return null;
  }

  const stackedEmojis = (topEmojis.length ? topEmojis : ["👍"]).map((emoji) =>
    isValidPostReactionType(emoji) ? reactionTypeToEmoji(emoji) : emoji
  );

  const content = (
    <>
      <div className="flex items-center">
        {stackedEmojis.map((emoji, index) => (
          <span
            key={`${emoji}-${index}`}
            aria-hidden="true"
            className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
              index === 0 ? "" : "-ml-2"
            }`}
          >
            {emoji}
          </span>
        ))}
      </div>
      <span className="text-sm font-normal">{formatCount(total)}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer inline-flex items-center gap-2 px-2 py-0.5 text-xs font-semibold text-muted-foreground "
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-secondary/40 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
      {content}
    </div>
  );
}
