"use client";

import { useMemo, useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useHomeFeed } from "@/features/pages/home/hooks/useHomeFeed";
import { PostTrigger } from "@/features/parts/post/components/PostTrigger";
import {
  FeedEmptyState,
  FeedErrorState,
  FeedInitialLoading,
} from "./FeedFallbacks";
import { FeedList } from "./FeedList";

const INITIAL_PAGE_SIZE = 10;

export function HomePostsSection() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
  } = useHomeFeed({ initialPageSize: INITIAL_PAGE_SIZE });

  const posts = useMemo(() => data?.posts ?? [], [data]);
  const hasMore = data?.hasMore ?? false;
  const isInitialLoading = isLoading && !data;

  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScroll({
    containerRef: feedContainerRef,
    sentinelRef,
    hasNextPage: hasMore,
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 400px 0px",
    enabled: hasMore,
  });

  if (isInitialLoading) {
    return <FeedInitialLoading />;
  }

  if (isError && !posts.length) {
    return <FeedErrorState onRetry={refetch} />;
  }

  return (
    <section className="space-y-6">
      <PostTrigger />

      <div ref={feedContainerRef} className="flex flex-col gap-6">
        {!posts.length ? (
          <FeedEmptyState />
        ) : (
          <FeedList
            posts={posts}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            sentinelRef={sentinelRef}
          />
        )}
      </div>
    </section>
  );
}
