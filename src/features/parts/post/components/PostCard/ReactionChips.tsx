import { useMemo } from "react";

import {
  isValidPostReactionType,
  reactionTypeToEmoji,
} from "../../constants/reactions";

type ReactionChipsProps = {
  summary?: Record<string, number> | null;
  testId?: string;
};

export function ReactionChips({ summary, testId }: ReactionChipsProps) {
  const chips = useMemo(() => {
    if (!summary) return [];

    return Object.entries(summary)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }, [summary]);

  const topEmojis = useMemo(() => chips.map(({ emoji }) => emoji), [chips]);
  const hasReactions = chips.length > 0;

  const stackedEmojis = (hasReactions ? topEmojis : ["👍"]).map((emoji) => {
    return isValidPostReactionType(emoji) ? reactionTypeToEmoji(emoji) : emoji;
  });

  return (
    <div className="flex items-center" data-testid={testId}>
      {stackedEmojis.map((emoji, index) => (
        <span
          key={`${emoji}-${index}`}
          aria-hidden="true"
          className={`flex h-6 w-6 items-center justify-center rounded-full text-base  ${
            index === 0 ? "" : "-ml-2"
          }`}
          data-testid={testId ? `${testId}-emoji-${index}` : undefined}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
