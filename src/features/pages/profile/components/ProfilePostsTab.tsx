"use client";

import { useMemo, useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useProfilePosts } from "@/features/pages/profile/hooks/useProfilePosts";
import { EditPostModalLayer } from "@/features/parts/post/components/EditPostModalLayer";
import { QueryError, QueryLoading } from "@/components";
import { EmptyState } from "@/components/EmptyState";
import { FeedList } from "@/features/pages/home/components/posts/FeedList";
import { INITIAL_PAGE_SIZE } from "@/features/pages/home/constants";
import { PostTrigger } from "@/features/parts/post/components/PostTrigger";
import { ClientSession } from "@/utils/session";

interface ProfilePostsTabProps {
  username: string;
  profileUserId: string;
}

export function ProfilePostsTab({
  username,
  profileUserId,
}: ProfilePostsTabProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfilePosts({
    username,
    initialPageSize: INITIAL_PAGE_SIZE,
  });
  const { data: session } = ClientSession();
  const currentUser = session?.user;
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
    return <QueryLoading />;
  }

  if (isError && !posts.length) {
    return <QueryError onRetry={refetch} />;
  }

  return (
    <>
      <section className="space-y-6 col-span-5">
        {currentUser?.id === profileUserId && <PostTrigger />}

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

      <EditPostModalLayer />
    </>
  );
}
