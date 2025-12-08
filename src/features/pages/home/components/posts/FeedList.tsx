"use client";

import type { RefObject } from "react";

import { QueryLoading } from "@/components";
import type { RankedPost } from "@/features/pages/home/utils/posts/post-ranking";

import { FeedItem } from "./FeedItem";

type FeedListProps = {
  posts: RankedPost[];
  isError: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
};

export function FeedList({
  posts,
  isError,
  isFetchingNextPage,
  sentinelRef,
}: FeedListProps) {
  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Something went wrong while refreshing the feed. Try again later.
        </div>
      )}

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <FeedItem key={post.postId} post={post} />
        ))}
      </div>

      {isFetchingNextPage && (
        <QueryLoading
          message="Loading more..."
          className="mx-auto mt-4 w-full max-w-sm"
        />
      )}

      <div ref={sentinelRef} className="h-1 w-full" />
    </div>
  );
}
