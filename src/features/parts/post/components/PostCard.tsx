"use client";

import { useCallback } from "react";

import { cn } from "@/lib/utils";

import { usePostViewObserver, useRealtimeSummary } from "../hooks";
import type { PostCardProps } from "./PostCard/types";
import { PostCardHeader } from "./PostCard/PostCardHeader";
import { PostCardBody } from "./PostCard/PostCardBody";
import { PostCardFooter } from "./PostCard/PostCardFooter";
import { usePostDetailsModalNavigation } from "../../postDetails/hooks";
import { VIEW_THRESHOLD, VIEW_DWELL_MS } from "../constants";

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
  const isViewerPostAuthor = Boolean(author?.isSelf);

  const enableUserChannel = isViewerPostAuthor && !isDetailsOpen;
  const enablePostDetailChannel = isDetailsOpen;

  useRealtimeSummary({
    postId,
    enableUserChannel,
    enablePostDetailChannel,
  });

  return (
    <article
      ref={targetRef}
      className={cn("rounded-xl  bg-white shadow-sm pt-4 ", className)}
    >
      <PostCardHeader author={author} timestamp={timestamp} />
      <PostCardBody content={content} />
      <PostCardFooter
        postId={postId}
        stats={stats}
        onCommentClick={handleOpenDetails}
        isDetailsOpen={isDetailsOpen}
      />
    </article>
  );
}
