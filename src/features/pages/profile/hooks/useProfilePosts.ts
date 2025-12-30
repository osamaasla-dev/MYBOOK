"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchProfilePostsPage } from "../services/client/profilePostsApi";
import type { ProfilePostsPage } from "../services/client/profilePostsApi";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";

export type UseProfilePostsOptions = {
  username: string;
  initialPageSize?: number;
  enabled?: boolean;
};

export type ProfilePostsQueryData = {
  pages: ProfilePostsPage[];
  pageParams: Array<string | undefined>;
  posts: FeedPost[];
};

export const PROFILE_POSTS_QUERY_KEY = (username: string) =>
  ["profile-posts", username] as const;

export function useProfilePosts({
  username,
  initialPageSize = 10,
  enabled = true,
}: UseProfilePostsOptions) {
  return useInfiniteQuery<
    ProfilePostsPage,
    Error,
    ProfilePostsQueryData,
    ReturnType<typeof PROFILE_POSTS_QUERY_KEY>,
    string | undefined
  >({
    queryKey: PROFILE_POSTS_QUERY_KEY(username),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchProfilePostsPage({
        username,
        cursor: pageParam,
        limit: initialPageSize,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => {
      const pages = data.pages;
      const flattenedPosts = pages.flatMap((page) => page.posts);

      return {
        pages,
        pageParams: data.pageParams,
        posts: flattenedPosts,
      };
    },
    refetchOnReconnect: true,
    staleTime: 60_000,
    gcTime: 60_000,
    enabled: enabled && Boolean(username),
  });
}
