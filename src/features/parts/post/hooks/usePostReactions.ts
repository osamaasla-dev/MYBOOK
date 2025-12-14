"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { ReactionSummary } from "../utils/reaction";
import type { PostReactionType } from "../constants/reactions";
import type {
  PostReactionListItem,
  PostReactionsResponse,
  ReactionTab,
} from "../services/server/reactions";
import {
  fetchPostReactionsPage,
  type FetchPostReactionsPageInput,
} from "../services/client/reactionsApi";

export type UsePostReactionsOptions = {
  postId: string;
  tab?: ReactionTab;
  limit?: FetchPostReactionsPageInput["limit"];
  enabled?: boolean;
};

export type PostReactionsQueryData = {
  pages: PostReactionsResponse[];
  pageParams: Array<string | undefined>;
  items: PostReactionListItem[];
  hasMore: boolean;
  reactionSummary: ReactionSummary | null;
  viewerReaction: PostReactionType | null;
};

export const postReactionsQueryKey = (
  postId: string,
  tab: ReactionTab = "all"
) => ["postReactions", { postId, tab }] as const;

type PostReactionsQueryKey = ReturnType<typeof postReactionsQueryKey>;

export function usePostReactions({
  postId,
  tab = "all",
  limit,
  enabled = true,
}: UsePostReactionsOptions) {
  const queryKey = postReactionsQueryKey(postId, tab);
  const isEnabled = enabled && Boolean(postId);

  return useInfiniteQuery<
    PostReactionsResponse,
    Error,
    PostReactionsQueryData,
    PostReactionsQueryKey
  >({
    queryKey,
    enabled: isEnabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchPostReactionsPage({
        postId,
        tab,
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => {
      const pages = data.pages;
      const lastPage = pages.at(-1);
      const firstPage = pages.at(0);

      return {
        pages,
        pageParams: data.pageParams as Array<string | undefined>,
        items: pages.flatMap((page) => page.items),
        hasMore: lastPage?.hasNextPage ?? false,
        reactionSummary: firstPage?.reactionSummary ?? null,
        viewerReaction: firstPage?.viewerReaction ?? null,
      };
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
