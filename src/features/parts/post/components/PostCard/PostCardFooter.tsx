import { MessageCircle, Share2, ThumbsUp } from "lucide-react";

import type { PostStats } from "./types";
import { formatCount } from "./utils";
import { ActionButton } from "./ActionButton";

type PostCardFooterProps = {
  stats?: PostStats;
};

export function PostCardFooter({ stats }: PostCardFooterProps) {
  const reactionsLabel =
    typeof stats?.reactions === "number"
      ? `${stats.reactionsEmoji ?? "👍"} ${formatCount(stats.reactions)}`
      : null;

  return (
    <footer className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-4">
        <div className="flex items-center gap-2">
          {reactionsLabel && (
            <span className="inline-flex items-center gap-1">
              {reactionsLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {typeof stats?.comments === "number" && (
            <span>{formatCount(stats.comments)} comments</span>
          )}
          {typeof stats?.shares === "number" && (
            <span>{formatCount(stats.shares)} shares</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between  border-t-border/60 py-2 text-sm font-medium text-muted-foreground">
        <ActionButton icon={ThumbsUp} label="Like" />
        <ActionButton icon={MessageCircle} label="Comment" />
        <ActionButton icon={Share2} label="Share" />
      </div>
    </footer>
  );
}
