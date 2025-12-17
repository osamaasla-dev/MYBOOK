"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { fetchPostReactionsPage } from "../services/client/reactionsApi";
import type {
  PostReactionsResponse,
  ReactionTab,
} from "../services/server/reactions";
import { postReactionsQueryKey } from "./usePostReactions";

type UsePrefetchPostReactionsOptions = {
  postId: string;
  tab?: ReactionTab;
  limit?: number;
};

type PrefetchOverrides = {
  tab?: ReactionTab;
  limit?: number;
};

export function usePrefetchPostReactions({
  postId,
  tab = "all",
  limit,
}: UsePrefetchPostReactionsOptions) {
  const queryClient = useQueryClient();

  return useCallback(
    async (overrides?: PrefetchOverrides) => {
      if (!postId) return;

      const targetTab = overrides?.tab ?? tab;
      const targetLimit = overrides?.limit ?? limit;
      const queryKey = postReactionsQueryKey(postId, targetTab);
      const existing = queryClient.getQueryData(queryKey);
      if (existing) return;

      await queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) =>
          fetchPostReactionsPage({
            postId,
            tab: targetTab,
            limit: targetLimit,
            cursor: pageParam as string | undefined,
          }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: PostReactionsResponse) =>
          lastPage.nextCursor ?? undefined,
        staleTime: 60_000,
        gcTime: 60_000,
      });
    },
    [postId, tab, limit, queryClient]
  );
}
