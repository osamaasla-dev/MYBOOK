"use client";

import { type RefObject } from "react";

import { QueryError, QueryLoading } from "@/components";
import { PostCard } from "@/features/parts/post/components/PostCard";
// import { buildPostCardPropsFromFeedPost } from "@/features/parts/post/components/PostCard/buildPost";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { PostCommentsSection } from "./PostCommentsSection";
import type { PostCommentsSectionProps } from "./PostCommentsSection";

export type PostDetailsContentProps = {
  post: FeedPost;
  postId: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
} & Pick<
  PostCommentsSectionProps,
  | "comments"
  | "areCommentsLoading"
  | "areCommentsError"
  | "commentsEmpty"
  | "onRetry"
  | "sentinelRef"
  | "isFetchingNextPage"
  | "hasMoreComments"
  | "viewerId"
  | "postAuthorId"
>;

export function PostDetailsContent({
  post,
  postId,
  isLoading,
  isError,
  refetch,
  scrollContainerRef,
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
}: PostDetailsContentProps) {
  const hasPost = Boolean(post);

  return (
    <section
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto rounded-none"
      role="main"
      aria-label="Post details content"
      data-testid="post-details-content"
    >
      {isLoading && <QueryLoading data-testid="post-details-loading" />}
      {isError && (
        <QueryError onRetry={refetch} data-testid="post-details-error" />
      )}

      {hasPost && (
        <PostCard
          post={post}
          className="rounded-none shadow-none"
          data-testid="post-details-post-card"
        />
      )}

      {hasPost && (
        <PostCommentsSection
          comments={comments}
          areCommentsLoading={areCommentsLoading}
          areCommentsError={areCommentsError}
          commentsEmpty={commentsEmpty}
          onRetry={onRetry}
          sentinelRef={sentinelRef}
          isFetchingNextPage={isFetchingNextPage}
          hasMoreComments={hasMoreComments}
          viewerId={viewerId}
          postAuthorId={postAuthorId}
          postId={postId}
        />
      )}

      {!isLoading && !hasPost && !isError && (
        <div
          className="rounded-2xl border border-dashed border-border/60 bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="post-details-unavailable"
        >
          Post details are unavailable right now.
        </div>
      )}
    </section>
  );
}
