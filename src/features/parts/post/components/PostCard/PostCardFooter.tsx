import { useMemo } from "react";

import type { PostStats } from "./types";
import { formatCount } from "./utils";
import { ReactionButton } from "./ReactionButton";
import { CommentButton } from "./CommentButton";
import { ShareButton } from "./ShareButton";
import { PostReactionSummary } from "./PostReactionSummary";
import { usePostReactionState } from "../../hooks/ui/postReactionState";

type PostCardFooterProps = {
  postId: string;
  stats?: PostStats;
  onCommentClick?: () => void;
};

export function PostCardFooter({
  postId,
  stats,
  onCommentClick,
}: PostCardFooterProps) {
  const initialReaction = useMemo(
    () => stats?.viewerReaction ?? null,
    [stats?.viewerReaction]
  );
  const initialSummary = useMemo(
    () => stats?.reactionSummary,
    [stats?.reactionSummary]
  );

  const {
    currentReaction,
    optimisticSummary,
    handleReactionSelect,
    handleRemove,
  } = usePostReactionState({
    postId,
    initialReaction,
    initialSummary,
  });

  return (
    <footer className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-4">
        <div className="flex flex-wrap items-center gap-2">
          <PostReactionSummary
            postId={postId}
            stats={stats}
            optimisticSummary={optimisticSummary}
          />
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

      <div className="flex items-center justify-between border-t-border/60 py-2 text-sm font-medium text-muted-foreground">
        <ReactionButton
          currentReaction={currentReaction}
          onReactionSelect={handleReactionSelect}
          onReactionClear={handleRemove}
        />
        <CommentButton onClick={onCommentClick} />
        <ShareButton />
      </div>
    </footer>
  );
}
