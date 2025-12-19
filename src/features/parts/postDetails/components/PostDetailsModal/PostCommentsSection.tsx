"use client";

import { type RefObject } from "react";

import { EmptyState, QueryError, QueryLoading } from "@/components";
import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";
import { CommentListItem } from "./CommentListItem";

export type PostCommentsSectionProps = {
  comments: PostCommentListItem[];
  areCommentsLoading: boolean;
  areCommentsError: boolean;
  commentsEmpty: boolean;
  onRetry: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  hasMoreComments: boolean;
};

export function PostCommentsSection({
  comments,
  areCommentsLoading,
  areCommentsError,
  commentsEmpty,
  onRetry,
  sentinelRef,
  isFetchingNextPage,
  hasMoreComments,
}: PostCommentsSectionProps) {
  return (
    <div className="bg-secondary/5 px-3 py-4">
      {areCommentsLoading && <QueryLoading />}
      {areCommentsError && <QueryError onRetry={onRetry} className="mt-2" />}

      {!areCommentsLoading && comments.length > 0 && (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <CommentListItem key={comment.id} comment={comment} />
          ))}
        </ul>
      )}

      {commentsEmpty && <EmptyState title="No comments yet" />}

      <div ref={sentinelRef} className="h-1 w-full" />

      {isFetchingNextPage && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Loading more comments…
        </p>
      )}

      {!hasMoreComments && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No more comments
        </p>
      )}
    </div>
  );
}
