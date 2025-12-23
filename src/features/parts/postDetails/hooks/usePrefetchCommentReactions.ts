"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/schema";
import type { CommentReactionsResponse } from "@/features/parts/postDetails/services/server/comment/reactions/types";
import { commentReactionsQueryKey } from "./useCommentReactions";
import { fetchCommentReactionsPage } from "@/features/parts/postDetails/services/client/commentReactionsApi";

type UsePrefetchCommentReactionsOptions = {
  postId: string;
  commentId: string;
  tab?: CommentReactionTab;
  limit?: number;
};

type PrefetchOverrides = {
  tab?: CommentReactionTab;
  limit?: number;
};

export function usePrefetchCommentReactions({
  postId,
  commentId,
  tab = "all",
  limit,
}: UsePrefetchCommentReactionsOptions) {
  const queryClient = useQueryClient();

  return useCallback(
    async (overrides?: PrefetchOverrides) => {
      if (!postId || !commentId) return;

      const targetTab = overrides?.tab ?? tab;
      const targetLimit = overrides?.limit ?? limit;
      const queryKey = commentReactionsQueryKey(postId, commentId, targetTab);
      const existing = queryClient.getQueryData(queryKey);
      if (existing) return;

      await queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) =>
          fetchCommentReactionsPage({
            postId,
            commentId,
            tab: targetTab,
            limit: targetLimit,
            cursor: pageParam as string | undefined,
          }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: CommentReactionsResponse) =>
          lastPage.nextCursor ?? undefined,
        staleTime: 60_000,
        gcTime: 60_000,
      });
    },
    [postId, commentId, tab, limit, queryClient]
  );
}
