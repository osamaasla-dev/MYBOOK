"use client";

import { useCallback } from "react";

import { cn } from "@/lib/utils";

import { usePostViewObserver } from "../hooks";
import type {} from "./PostCard/types";
import { PostCardHeader } from "./PostCard/PostCardHeader";
import { PostCardBody } from "./PostCard/PostCardBody";
import { PostCardFooter } from "./PostCard/PostCardFooter";
import { usePostDetailsModalNavigation } from "../../postDetails/hooks";
import { VIEW_THRESHOLD, VIEW_DWELL_MS } from "../constants";
import { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

type PostCardProps = {
  post: FeedPost;
  className?: string;
};
export function PostCard({ post, className }: PostCardProps) {
  const { targetRef } = usePostViewObserver({
    postId: post.postId,
    threshold: VIEW_THRESHOLD,
    dwellMs: VIEW_DWELL_MS,
  });
  const { openPostDetails, currentPostId } = usePostDetailsModalNavigation();

  const handleOpenDetails = useCallback(() => {
    openPostDetails(post.postId);
  }, [openPostDetails, post.postId]);

  const isDetailsOpen = currentPostId === post.postId;

  return (
    <article
      ref={targetRef}
      className={cn("rounded-xl  bg-white shadow-sm pt-4 ", className)}
    >
      <PostCardHeader
        author={post.author}
        timestamp={post.publishedAt}
        post={post}
      />
      <PostCardBody content={post.content} />
      <PostCardFooter
        postId={post.postId}
        stats={{
          reactions: post.reactionsCount,
          comments: post.commentsCount,
          shares: post.sharesCount,
          viewerReaction: post.interactions.viewerReaction,
          reactionSummary: post.reactionSummary,
        }}
        onCommentClick={handleOpenDetails}
        isDetailsOpen={isDetailsOpen}
      />
    </article>
  );
}
