"use client";

import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  POST_REACTION_OPTIONS,
  type PostReactionType,
} from "@/features/parts/post/constants/reactions";
import { useCommentReactionButton } from "./useCommentReactionButton";

type CommentReactionButtonProps = {
  postId: string;
  commentId: string;
  parentId: string | null;
  viewerReaction: PostReactionType | null;
  disabled?: boolean;
};

export function CommentReactionButton({
  postId,
  commentId,
  parentId,
  viewerReaction,
  disabled = false,
}: CommentReactionButtonProps) {
  const {
    pickerRef,
    isPickerOpen,
    togglePicker,
    selectReaction,
    clearReaction,
    effectiveDisabled,
    currentReaction,
    currentLabel,
  } = useCommentReactionButton({
    postId,
    commentId,
    parentId,
    viewerReaction,
    disabled,
  });

  const pickerId = `comment-reaction-picker-${commentId}`;
  const triggerLabel = currentReaction
    ? `Change reaction (currently ${currentLabel})`
    : "Add a reaction";

  return (
    <div ref={pickerRef} className="relative inline-flex">
      <Button
        type="button"
        variant="none"
        size="sm"
        className="group relative h-7 w-9 text-base hover:underline"
        aria-haspopup="menu"
        aria-expanded={isPickerOpen}
        aria-pressed={Boolean(currentReaction)}
        aria-controls={pickerId}
        aria-label={triggerLabel}
        disabled={effectiveDisabled}
        onClick={togglePicker}
        data-testid={`comment-reaction-trigger-${commentId}`}
      >
        <span
          className={`text-sm font-semibold ${
            currentReaction ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {currentLabel}
        </span>
        <span className="pointer-events-none absolute -top-6 left-1/2 w-max -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {currentLabel}
        </span>
      </Button>

      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-0 z-10 mb-2 rounded-2xl border border-border/60 bg-white px-2 py-1 shadow-lg"
            role="menu"
            aria-label="Comment reaction choices"
            id={pickerId}
            data-testid={`comment-reaction-picker-${commentId}`}
          >
            <div className="flex items-center gap-1">
              {currentReaction && (
                <button
                  type="button"
                  className="group relative flex size-8 items-center justify-center rounded-xl text-xl hover:bg-destructive/10"
                  onClick={clearReaction}
                  aria-label="Remove reaction"
                  data-testid={`comment-reaction-remove-${commentId}`}
                >
                  <span aria-hidden="true" className="cursor-pointer">
                    ⛔
                  </span>
                  <span className="pointer-events-none absolute -top-6 min-w-[48px] rounded-full bg-black/80 px-2 py-0.5 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    Remove
                  </span>
                </button>
              )}
              {POST_REACTION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="group relative flex size-8 items-center justify-center rounded-xl text-xl hover:bg-primary/5 cursor-pointer"
                  onClick={() => selectReaction(option.id)}
                  role="menuitemradio"
                  aria-checked={currentReaction === option.id}
                  aria-label={`${option.label} reaction`}
                  data-testid={`comment-reaction-option-${option.id}`}
                >
                  <span aria-hidden="true">{option.emoji}</span>
                  <span className="pointer-events-none absolute -top-6 min-w-[48px] rounded-full bg-black/80 px-2 py-0.5 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
