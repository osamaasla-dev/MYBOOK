import { useMemo, useState, useCallback, type KeyboardEvent } from "react";

import { calculateReactionsCount } from "../../hooks/utils/reactionSummary";
import type { PostStats } from "./types";
import { formatCount } from "./utils";
import { PostReactionsModal } from "../PostReactionsModal";
import { usePrefetchPostReactions } from "../../hooks/usePrefetchPostReactions";
import { ReactionChips } from "./ReactionChips";
import { ReactionCount } from "./ReactionCount";

type PostReactionSummaryProps = {
  postId: string;
  stats?: PostStats;
  testId?: string;
};

export function PostReactionSummary({
  postId,
  stats,
  testId,
}: PostReactionSummaryProps) {
  const initialSummary = stats?.reactionSummary ?? null;
  const totalReactions = useMemo(() => {
    if (typeof stats?.reactions === "number") {
      return stats.reactions;
    }
    return calculateReactionsCount(initialSummary);
  }, [initialSummary, stats?.reactions]);

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
        data-testid={testId}
        aria-label={`View ${formatCount(totalReactions)} reactions`}
        aria-expanded={isModalOpen}
      >
        <ReactionChips
          summary={initialSummary}
          testId={testId ? `${testId}-emojis` : undefined}
        />
        <ReactionCount
          count={totalReactions}
          testId={testId ? `${testId}-count` : undefined}
        />
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
