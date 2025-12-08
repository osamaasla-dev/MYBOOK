"use client";

import { cn } from "@/lib/utils";

import type { PostCardProps } from "./types";
import { PostCardHeader } from "./PostCardHeader";
import { PostCardBody } from "./PostCardBody";
import { PostCardFooter } from "./PostCardFooter";

export function PostCard({
  author,
  timestamp,
  content,
  stats,
  className,
}: PostCardProps) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-border/60 bg-white shadow-sm pt-4 pb-4",
        className
      )}
    >
      <PostCardHeader author={author} timestamp={timestamp} />
      <PostCardBody content={content} />
      <PostCardFooter stats={stats} />
    </article>
  );
}
