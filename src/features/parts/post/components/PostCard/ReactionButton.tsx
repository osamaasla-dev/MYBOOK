"use client";

import { useEffect, useRef, useState } from "react";
import { ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  POST_REACTION_OPTIONS,
  type PostReactionType,
} from "../../constants/reactions";

import { motion, AnimatePresence } from "framer-motion";
import { PostStats } from "./types";

type ReactionButtonProps = {
  stats?: PostStats;
  onReactionSelect: (reactionId: PostReactionType) => void;
  onReactionClear?: () => void;
};

export function ReactionButton({
  stats,
  onReactionSelect,
  onReactionClear,
}: ReactionButtonProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPickerOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isPickerOpen]);

  const togglePicker = () => setIsPickerOpen((prev) => !prev);

  const handleSelect = (reactionId: PostReactionType) => {
    onReactionSelect(reactionId);
    setIsPickerOpen(false);
  };

  const handleClear = () => {
    onReactionClear?.();
    setIsPickerOpen(false);
  };
  const reaction = stats?.viewerReaction ?? null;
  return (
    <div ref={reactionPickerRef} className="relative flex flex-1">
      <Button
        type="button"
        className="flex flex-1 items-center justify-center rounded-md bg-transparent px-2 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
        aria-haspopup="menu"
        aria-expanded={isPickerOpen}
        onClick={togglePicker}
      >
        {reaction ? (
          <span className="mr-2 text-lg" aria-hidden="true">
            {POST_REACTION_OPTIONS.find((item) => item.id === reaction)
              ?.emoji ?? "👍"}
          </span>
        ) : (
          <ThumbsUp className="mr-2 size-4" aria-hidden="true" />
        )}
        <span className="font-semibold">
          {reaction
            ? POST_REACTION_OPTIONS.find((opt) => opt.id === reaction)?.label
            : "React"}
        </span>
      </Button>

      {/* Animated Reaction Picker */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-2 rounded-2xl border border-border/60 bg-white shadow-xl"
          >
            <div className="flex items-center">
              {reaction && onReactionClear && (
                <button
                  type="button"
                  className="cursor-pointer group relative flex size-10 items-center justify-center rounded-xl text-2xl hover:bg-destructive/10"
                  onClick={handleClear}
                  aria-label="Remove reaction"
                >
                  <span aria-hidden="true">⛔</span>
                  <span className="pointer-events-none absolute -top-6 min-w-[48px] rounded-full bg-black/80 px-2 py-0.5 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    No reaction
                  </span>
                </button>
              )}
              {POST_REACTION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="cursor-pointer group relative flex size-10 items-center justify-center rounded-xl text-2xl hover:bg-primary/5"
                  onClick={() => handleSelect(option.id)}
                  aria-label={option.label}
                >
                  <span aria-hidden="true">{option.emoji}</span>

                  {/* Tooltip */}
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
