"use client";

import { type PostReactionType } from "../../constants/reactions";
import { PostStats } from "./types";
import { useReactionPicker } from "./useReactionPicker";
import { ReactionTrigger } from "./ReactionTrigger";
import { ReactionPicker } from "./ReactionPicker";

type ReactionButtonProps = {
  stats?: PostStats;
  onReactionSelect: (reactionId: PostReactionType) => void;
  onReactionClear?: () => void;
  testId?: string;
};

export function ReactionButton({
  stats,
  onReactionSelect,
  onReactionClear,
  testId,
}: ReactionButtonProps) {
  const currentReaction = stats?.viewerReaction ?? null;

  const {
    isPickerOpen,
    reactionPickerRef,
    togglePicker,
    handleSelect,
    handleClear,
  } = useReactionPicker({ onReactionSelect, onReactionClear });

  return (
    <div
      ref={reactionPickerRef}
      className="relative flex flex-1"
      data-testid={testId}
    >
      <ReactionTrigger
        currentReaction={currentReaction}
        isPickerOpen={isPickerOpen}
        onToggle={togglePicker}
        testId={testId}
      />

      <ReactionPicker
        isOpen={isPickerOpen}
        onSelect={handleSelect}
        onClear={handleClear}
        showClearOption={!!currentReaction && !!onReactionClear}
        testId={testId}
      />
    </div>
  );
}
