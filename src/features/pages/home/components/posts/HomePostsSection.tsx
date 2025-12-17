"use client";

import { useMemo, useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useHomeFeed } from "@/features/pages/home/hooks/useHomeFeed";
import { PostTrigger } from "@/features/parts/post/components/PostTrigger";
import { QueryError, QueryLoading } from "@/components";
import { EmptyState } from "@/components/EmptyState";
import { FeedList } from "./FeedList";
import { INITIAL_PAGE_SIZE } from "../../constants";

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

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScroll({
    sentinelRef,
    hasNextPage: hasMore,
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 400px 0px",
    enabled: hasMore,
  });

  if (isInitialLoading) {
    return <QueryLoading />;
  }

  if (isError && !posts.length) {
    return <QueryError onRetry={refetch} />;
  }

  return (
    <section className="space-y-6 col-span-3">
      <PostTrigger />

      <div className="flex flex-col gap-6">
        {!posts.length ? (
          <EmptyState title={"No posts found"} className="bg-white" />
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
