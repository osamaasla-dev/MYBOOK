"use client";

import { useCallback } from "react";

import type { PostStats } from "./types";
import { formatCount } from "./utils";
import { ReactionButton } from "./ReactionButton";
import { CommentButton } from "./CommentButton";
import { ShareButton } from "./ShareButton";
import { PostReactionSummary } from "./PostReactionSummary";
import { usePrefetchPostDetails } from "@/features/parts/postDetails/hooks";
import { useReactToPost } from "../../hooks/useReactToPost";
import { useRemovePostReaction } from "../../hooks/useRemovePostReaction";
import type { PostReactionType } from "../../constants/reactions";

type PostCardFooterProps = {
  postId: string;
  stats?: PostStats;
  onCommentClick?: () => void;
  isDetailsOpen?: boolean;
};

export function PostCardFooter({
  postId,
  stats,
  onCommentClick,
  isDetailsOpen = false,
}: PostCardFooterProps) {
  const prefetchPostDetails = usePrefetchPostDetails({ postId });
  const reactToPostMutation = useReactToPost();
  const removeReactionMutation = useRemovePostReaction();

  const handleReactionSelect = useCallback(
    (reaction: PostReactionType) => {
      reactToPostMutation.mutate({ postId, reaction });
    },
    [postId, reactToPostMutation]
  );

  const handleRemoveReaction = useCallback(() => {
    removeReactionMutation.mutate({ postId });
  }, [postId, removeReactionMutation]);

  return (
    <footer className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-4">
        <div className="flex flex-wrap items-center gap-2">
          <PostReactionSummary postId={postId} stats={stats} />
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
          stats={stats}
          onReactionSelect={handleReactionSelect}
          onReactionClear={handleRemoveReaction}
        />
        <CommentButton
          onClick={onCommentClick}
          onHover={prefetchPostDetails}
          disabled={isDetailsOpen}
        />
        <ShareButton />
      </div>
    </footer>
  );
}
