"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import type {
  CommentReactionListItem,
  CommentReactionsResponse,
} from "@/features/parts/postDetails/services/server/comment/reactions/types";
import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/schema";
import {
  fetchCommentReactionsPage,
  type FetchCommentReactionsPageInput,
} from "@/features/parts/postDetails/services/client/commentReactionsApi";

export type UseCommentReactionsOptions = {
  postId: string;
  commentId: string;
  tab?: CommentReactionTab;
  limit?: FetchCommentReactionsPageInput["limit"];
  enabled?: boolean;
};

export type CommentReactionsQueryData = {
  pages: CommentReactionsResponse[];
  pageParams: Array<string | undefined>;
  items: CommentReactionListItem[];
  hasMore: boolean;
  reactionSummary: ReactionSummary | null;
  viewerReaction: PostReactionType | null;
};

export const commentReactionsQueryKey = (
  postId: string,
  commentId: string,
  tab: CommentReactionTab = "all"
) => ["commentReactions", { postId, commentId, tab }] as const;

type CommentReactionsQueryKey = ReturnType<typeof commentReactionsQueryKey>;

export function useCommentReactions({
  postId,
  commentId,
  tab = "all",
  limit,
  enabled = true,
}: UseCommentReactionsOptions) {
  const queryKey = commentReactionsQueryKey(postId, commentId, tab);
  const isEnabled = enabled && Boolean(postId) && Boolean(commentId);

  return useInfiniteQuery<
    CommentReactionsResponse,
    Error,
    CommentReactionsQueryData,
    CommentReactionsQueryKey
  >({
    queryKey,
    enabled: isEnabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchCommentReactionsPage({
        postId,
        commentId,
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
    placeholderData: keepPreviousData,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}
