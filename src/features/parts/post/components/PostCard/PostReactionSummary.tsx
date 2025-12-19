import { useMemo, useState, useCallback, type KeyboardEvent } from "react";

import {
  isValidPostReactionType,
  reactionTypeToEmoji,
} from "../../constants/reactions";
import { calculateReactionsCount } from "../../hooks/utils/reactionSummary";
import type { PostStats } from "./types";
import { formatCount } from "./utils";
import { PostReactionsModal } from "../PostReactionsModal";
import { usePrefetchPostReactions } from "../../hooks/usePrefetchPostReactions";

type PostReactionSummaryProps = {
  postId: string;
  stats?: PostStats;
};

export function PostReactionSummary({
  postId,
  stats,
}: PostReactionSummaryProps) {
  const initialSummary = stats?.reactionSummary ?? null;

  const chips = useMemo(() => {
    if (!initialSummary) return [];

    return Object.entries(initialSummary)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialSummary]);

  const totalReactions = useMemo(() => {
    if (typeof stats?.reactions === "number") {
      return stats.reactions;
    }
    return calculateReactionsCount(initialSummary);
  }, [initialSummary, stats?.reactions]);

  const topEmojis = useMemo(() => chips.map(({ emoji }) => emoji), [chips]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const prefetchReactions = usePrefetchPostReactions({ postId });

  const handlePrefetch = useCallback(() => {
    prefetchReactions();
  }, [prefetchReactions]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenModal();
    }
  };

  const hasReactions = totalReactions > 0;

  const stackedEmojis = (hasReactions ? topEmojis : ["👍"]).map((emoji) => {
    return isValidPostReactionType(emoji) ? reactionTypeToEmoji(emoji) : emoji;
  });

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenModal}
        onKeyDown={handleKeyDown}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        className="curaor-pointer flex items-center gap-2 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <div className="flex items-center">
          {stackedEmojis.map((emoji, index) => (
            <span
              key={`${emoji}-${index}`}
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-full text-base  ${
                index === 0 ? "" : "-ml-2"
              }`}
            >
              {emoji}
            </span>
          ))}
        </div>
        <span className="text-md">{formatCount(totalReactions)}</span>
      </div>
      <PostReactionsModal
        postId={postId}
        open={isModalOpen}
        onClose={handleCloseModal}
        initialSummary={initialSummary}
      />
    </>
  );
}
