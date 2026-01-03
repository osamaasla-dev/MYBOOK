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
  testId?: string;
};

export function PostCardFooter({
  postId,
  stats,
  onCommentClick,
  isDetailsOpen = false,
  testId,
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
    <footer className="mt-4 space-y-3" data-testid={testId}>
      <div
        className="flex items-center justify-between text-xs text-muted-foreground px-4"
        data-testid={`${testId}-stats`}
        role="group"
        aria-label="Post statistics"
      >
        <div className="flex flex-wrap items-center gap-2">
          <PostReactionSummary
            postId={postId}
            stats={stats}
            testId={`${testId}-reactions`}
          />
        </div>
        <div
          className="flex items-center gap-4"
          data-testid={`${testId}-counts`}
        >
          {typeof stats?.comments === "number" && (
            <span
              data-testid={`${testId}-comments-count`}
              aria-label={`${formatCount(stats.comments)} comments`}
            >
              {formatCount(stats.comments)} comments
            </span>
          )}
          {typeof stats?.shares === "number" && (
            <span
              data-testid={`${testId}-shares-count`}
              aria-label={`${formatCount(stats.shares)} shares`}
            >
              {formatCount(stats.shares)} shares
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center justify-between border-t-border/60 py-2 text-sm font-medium text-muted-foreground"
        data-testid={`${testId}-actions`}
        role="group"
        aria-label="Post actions"
      >
        <ReactionButton
          stats={stats}
          onReactionSelect={handleReactionSelect}
          onReactionClear={handleRemoveReaction}
          testId={`${testId}-reaction-button`}
        />
        <CommentButton
          onClick={onCommentClick}
          onHover={prefetchPostDetails}
          disabled={isDetailsOpen}
          testId={`${testId}-comment-button`}
        />
        <ShareButton testId={`${testId}-share-button`} />
      </div>
    </footer>
  );
}
