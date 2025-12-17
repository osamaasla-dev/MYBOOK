"use client";

import { useCallback } from "react";

import { cn } from "@/lib/utils";

import { usePostViewObserver } from "../hooks";
import type { PostCardProps } from "./PostCard/types";
import { PostCardHeader } from "./PostCard/PostCardHeader";
import { PostCardBody } from "./PostCard/PostCardBody";
import { PostCardFooter } from "./PostCard/PostCardFooter";
import { usePostDetailsModalNavigation } from "../../postDetails/hooks";

const VIEW_THRESHOLD = 0.5;
const VIEW_DWELL_MS = 3_000;

export function PostCard({
  postId,
  author,
  timestamp,
  content,
  stats,
  className,
}: PostCardProps) {
  const { targetRef } = usePostViewObserver({
    postId,
    threshold: VIEW_THRESHOLD,
    dwellMs: VIEW_DWELL_MS,
  });
  const { openPostDetails, currentPostId } = usePostDetailsModalNavigation();

  const handleOpenDetails = useCallback(() => {
    openPostDetails(postId);
  }, [openPostDetails, postId]);

  const isDetailsOpen = currentPostId === postId;

  return (
    <article
      ref={targetRef}
      className={cn(
        "rounded-xl border border-border/60 bg-white shadow-sm pt-4 ",
        className
      )}
    >
      <PostCardHeader author={author} timestamp={timestamp} />
      <PostCardBody content={content} />
      <PostCardFooter
        postId={postId}
        stats={stats}
        onCommentClick={handleOpenDetails}
        isCommentDisabled={isDetailsOpen}
      />
    </article>
  );
}
