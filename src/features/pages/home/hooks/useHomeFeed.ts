"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import type {
  FeedPost,
  FeedPostsPage,
} from "@/features/pages/home/utils/posts/feed-response";
import { fetchHomeFeedPage } from "../services/posts/feedApi";

export type UseHomeFeedOptions = {
  initialPageSize?: number;
  enabled?: boolean;
};

export type HomeFeedQueryData = {
  pages: FeedPostsPage[];
  pageParams: Array<number | undefined>;
  posts: FeedPost[];
  hasMore: boolean;
};

export const HOME_FEED_QUERY_KEY = ["home-feed"] as const;

export function useHomeFeed({
  initialPageSize,
  enabled = true,
}: UseHomeFeedOptions = {}) {
  return useInfiniteQuery<
    FeedPostsPage,
    Error,
    HomeFeedQueryData,
    typeof HOME_FEED_QUERY_KEY,
    number | undefined
  >({
    queryKey: HOME_FEED_QUERY_KEY,
    enabled,
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) =>
      fetchHomeFeedPage({
        cursor: pageParam,
        pageSize: initialPageSize,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => {
      const pages = data.pages;
      const flattenedPosts = pages.flatMap((page) => page.posts);
      const lastPage = pages[pages.length - 1];

      return {
        pages,
        pageParams: data.pageParams as Array<number | undefined>,
        posts: flattenedPosts,
        hasMore: pages.length ? Boolean(lastPage?.nextCursor) : false,
      };
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    staleTime: 0,
    gcTime: 0,
  });
}
