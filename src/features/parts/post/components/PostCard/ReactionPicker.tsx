import { motion, AnimatePresence } from "framer-motion";

import {
  POST_REACTION_OPTIONS,
  type PostReactionType,
} from "../../constants/reactions";

type ReactionPickerProps = {
  isOpen: boolean;
  onSelect: (reactionId: PostReactionType) => void;
  onClear: () => void;
  showClearOption: boolean;
  testId?: string;
};

export function ReactionPicker({
  isOpen,
  onSelect,
  onClear,
  showClearOption,
  testId,
}: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute bottom-full left-0 mb-2 rounded-2xl border border-border/60 bg-white shadow-xl"
          data-testid={`${testId}-picker`}
          role="menu"
          aria-label="Reaction options"
        >
          <div className="flex items-center">
            {showClearOption && (
              <button
                type="button"
                className="cursor-pointer group relative flex size-10 items-center justify-center rounded-xl text-2xl hover:bg-destructive/10"
                onClick={onClear}
                aria-label="Remove reaction"
                data-testid={`${testId}-clear`}
                role="menuitem"
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
                onClick={() => onSelect(option.id)}
                aria-label={option.label}
                data-testid={`${testId}-option-${option.id}`}
                role="menuitem"
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
  );
}
