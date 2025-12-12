"use client";

import { cn } from "@/lib/utils";

import { usePostViewObserver } from "../../hooks";
import type { PostCardProps } from "./types";
import { PostCardHeader } from "./PostCardHeader";
import { PostCardBody } from "./PostCardBody";
import { PostCardFooter } from "./PostCardFooter";

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

  return (
    <article
      ref={targetRef}
      className={cn(
        "rounded-3xl border border-border/60 bg-white shadow-sm pt-4 ",
        className
      )}
    >
      <PostCardHeader author={author} timestamp={timestamp} />
      <PostCardBody content={content} />
      <PostCardFooter postId={postId} stats={stats} />
    </article>
  );
}
