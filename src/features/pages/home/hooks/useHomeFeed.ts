"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type {
  RankedFeedPage,
  RankedPost,
} from "@/features/pages/home/utils/posts/post-ranking";
import { fetchHomeFeedPage } from "../services/posts/feedApi";

export type UseHomeFeedOptions = {
  initialPageSize?: number;
  enabled?: boolean;
};

export type HomeFeedQueryData = {
  pages: RankedFeedPage[];
  pageParams: Array<number | undefined>;
  posts: RankedPost[];
  hasMore: boolean;
};

export const HOME_FEED_QUERY_KEY = ["home-feed"] as const;

export function useHomeFeed({
  initialPageSize,
  enabled = true,
}: UseHomeFeedOptions = {}) {
  return useInfiniteQuery<
    RankedFeedPage,
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
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams as Array<number | undefined>,
      posts: data.pages.flatMap((page) => page.posts),
      hasMore: data.pages.length
        ? Boolean(data.pages[data.pages.length - 1].nextCursor)
        : false,
    }),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
  });
}
