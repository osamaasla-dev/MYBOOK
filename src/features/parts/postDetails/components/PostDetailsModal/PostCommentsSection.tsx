"use client";

import { type RefObject } from "react";

import { EmptyState, QueryError, QueryLoading } from "@/components";
import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";
import { CommentListItem } from "./Comments/CommentListItem";

export type PostCommentsSectionProps = {
  comments: PostCommentListItem[];
  areCommentsLoading: boolean;
  areCommentsError: boolean;
  commentsEmpty: boolean;
  onRetry: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  hasMoreComments: boolean;
  viewerId: string | null;
  postAuthorId: string | null;
  postId: string;
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
  viewerId,
  postAuthorId,
  postId,
}: PostCommentsSectionProps) {
  return (
    <div
      className="bg-secondary/5 px-3 py-4"
      role="region"
      aria-label="Comments section"
      data-testid="post-comments-section"
    >
      {areCommentsLoading && <QueryLoading data-testid="comments-loading" />}
      {areCommentsError && (
        <QueryError
          onRetry={onRetry}
          className="mt-2"
          data-testid="comments-error"
        />
      )}

      {!areCommentsLoading && comments.length > 0 && (
        <ul
          className="space-y-2"
          role="list"
          aria-label="Comments list"
          data-testid="comments-list"
        >
          {comments.map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
              viewerId={viewerId}
              postAuthorId={postAuthorId}
              postId={postId}
            />
          ))}
        </ul>
      )}

      {commentsEmpty && (
        <EmptyState title="No comments yet" data-testid="comments-empty" />
      )}

      <div
        ref={sentinelRef}
        className="h-1 w-full"
        data-testid="comments-sentinel"
      />

      {isFetchingNextPage && (
        <p
          className="mt-2 text-center text-xs text-muted-foreground"
          data-testid="comments-loading-more"
        >
          Loading more comments…
        </p>
      )}

      {!hasMoreComments &&
        !areCommentsLoading &&
        !areCommentsError &&
        !commentsEmpty && (
          <p
            className="mt-2 text-center text-xs text-muted-foreground"
            data-testid="comments-no-more"
          >
            No more comments
          </p>
        )}
    </div>
  );
}
