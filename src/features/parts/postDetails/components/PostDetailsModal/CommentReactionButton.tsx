"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  POST_REACTION_OPTIONS,
  type PostReactionType,
} from "@/features/parts/post/constants/reactions";
import { useReactToComment } from "../../hooks/useReactToComment";
import { useRemoveCommentReaction } from "../../hooks/useRemoveCommentReaction";
import { useReactToReply } from "../../hooks/useReactToReply";
import { useRemoveReplyReaction } from "../../hooks/useRemoveReplyReaction";

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
  const reactCommentMutation = useReactToComment({ postId, parentId });
  const reactToReplyMutation = useReactToReply({
    postId,
    parentId: parentId ?? "",
  });
  const removeCommentMutation = useRemoveCommentReaction({ postId, parentId });
  const removeReplyMutation = useRemoveReplyReaction({
    postId,
    parentId: parentId ?? "",
  });
  // Choose the appropriate mutation based on whether this is a reply
  const activeReactMutation = parentId
    ? reactToReplyMutation
    : reactCommentMutation;

  const activeRemoveMutation = parentId
    ? removeReplyMutation
    : removeCommentMutation;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const effectiveDisabled = disabled;

  useEffect(() => {
    if (!isPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsPickerOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPickerOpen]);

  const togglePicker = () => {
    if (effectiveDisabled) return;
    setIsPickerOpen((prev) => !prev);
  };

  const handleSelect = (reactionId: PostReactionType) => {
    activeReactMutation.mutate({ commentId, reaction: reactionId });
    setIsPickerOpen(false);
  };

  const handleClear = () => {
    activeRemoveMutation.mutate({ commentId });
    setIsPickerOpen(false);
  };

  const currentReaction = viewerReaction;
  const currentLabel = currentReaction
    ? POST_REACTION_OPTIONS.find((option) => option.id === currentReaction)
        ?.label ?? "React"
    : "React";

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
        disabled={effectiveDisabled}
        onClick={togglePicker}
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
          >
            <div className="flex items-center gap-1">
              {currentReaction && (
                <button
                  type="button"
                  className="group relative flex size-8 items-center justify-center rounded-xl text-xl hover:bg-destructive/10"
                  onClick={handleClear}
                  aria-label="Remove reaction"
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
                  onClick={() => handleSelect(option.id)}
                  aria-label={option.label}
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
