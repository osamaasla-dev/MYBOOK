import { ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  POST_REACTION_OPTIONS,
  type PostReactionType,
} from "../../constants/reactions";

type ReactionTriggerProps = {
  currentReaction: PostReactionType | null;
  isPickerOpen: boolean;
  onToggle: () => void;
  testId?: string;
};

export function ReactionTrigger({
  currentReaction,
  isPickerOpen,
  onToggle,
  testId,
}: ReactionTriggerProps) {
  return (
    <Button
      type="button"
      className="flex flex-1 items-center justify-center rounded-md bg-transparent px-2 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
      aria-haspopup="menu"
      aria-expanded={isPickerOpen}
      onClick={onToggle}
      data-testid={`${testId}-trigger`}
      aria-label={`${currentReaction ? "Change reaction" : "Add reaction"}`}
    >
      {currentReaction ? (
        <span
          className="mr-2 text-lg"
          aria-hidden="true"
          data-testid={`${testId}-current-emoji`}
        >
          {POST_REACTION_OPTIONS.find((item) => item.id === currentReaction)
            ?.emoji ?? "👍"}
        </span>
      ) : (
        <ThumbsUp
          className="mr-2 size-4"
          aria-hidden="true"
          data-testid={`${testId}-default-icon`}
        />
      )}
      <span className="font-semibold" data-testid={`${testId}-label`}>
        {currentReaction
          ? POST_REACTION_OPTIONS.find((opt) => opt.id === currentReaction)
              ?.label
          : "React"}
      </span>
    </Button>
  );
}
