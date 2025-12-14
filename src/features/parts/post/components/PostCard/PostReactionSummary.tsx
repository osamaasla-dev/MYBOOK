import { useMemo, useState, type KeyboardEvent } from "react";

import {
  isValidPostReactionType,
  reactionTypeToEmoji,
} from "../../constants/reactions";
import type { ReactionSummary } from "../../utils/reaction";
import type { PostStats } from "./types";
import { formatCount } from "./utils";
import { PostReactionsModal } from "../PostReactionsModal";

type PostReactionSummaryProps = {
  postId: string;
  stats?: PostStats;
  optimisticSummary?: ReactionSummary | null;
};

export function PostReactionSummary({
  postId,
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialSummary = optimisticSummary ?? stats?.reactionSummary ?? null;

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenModal();
    }
  };

  if (chips.length === 0 && typeof stats?.reactions !== "number") {
    return null;
  }

  const summaryContent =
    chips.length === 0
      ? [
          <span
            key="placeholder"
            className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 ${"border-border/60"}`}
          >
            <span>👍</span>
            <span className="font-semibold">0</span>
          </span>,
        ]
      : chips.map(({ emoji, count }) => {
          const displayEmoji = isValidPostReactionType(emoji)
            ? reactionTypeToEmoji(emoji)
            : emoji;

          return (
            <span
              key={emoji}
              className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 ${"border-border/60"}`}
            >
              <span aria-hidden="true">{displayEmoji}</span>
              <span className="font-semibold">{formatCount(count)}</span>
            </span>
          );
        });

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenModal}
        onKeyDown={handleKeyDown}
        className="curaor-pointer flex items-center gap-1 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label="View all reactions"
      >
        {summaryContent}
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
