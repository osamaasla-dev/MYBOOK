"use client";

import { useMemo, useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useHomeFeed } from "@/features/pages/home/hooks/useHomeFeed";
import { PostTrigger } from "@/features/parts/post/components/PostTrigger";
import { EditPostModalLayer } from "@/features/parts/post/components/EditPostModalLayer";
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
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHomeFeed({ initialPageSize: INITIAL_PAGE_SIZE });

  const posts = useMemo(() => data?.posts ?? [], [data]);
  const isInitialLoading = isLoading && !data;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useInfiniteScroll({
    sentinelRef,
    hasNextPage,
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 400px 0px",
    enabled: hasNextPage,
  });

  if (isInitialLoading) {
    return (
      <div
        className="col-span-5"
        data-testid="home-posts-loading"
        role="status"
        aria-live="polite"
        aria-busy={true}
      >
        <QueryLoading
          message="Loading posts..."
          testId="home-posts-query-loading"
        />
      </div>
    );
  }

  if (isError && !posts.length) {
    return (
      <div
        className="col-span-5"
        data-testid="home-posts-error"
        role="alert"
        aria-live="assertive"
      >
        <QueryError onRetry={refetch} testId="home-posts-query-error" />
      </div>
    );
  }

  return (
    <>
      <section
        className="space-y-6 col-span-5"
        data-testid="home-posts-section"
        aria-labelledby="home-posts-heading"
      >
        <h2 id="home-posts-heading" className="sr-only">
          Posts Feed
        </h2>
        <PostTrigger />

        <div className="flex flex-col gap-6">
          {!posts.length ? (
            <EmptyState
              title={"No posts found"}
              message="Be the first to share something with the community!"
              className="bg-white"
              testId="home-posts-empty"
            />
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

      <EditPostModalLayer />
    </>
  );
}
