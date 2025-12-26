"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  fetchPostCommentsRequest,
  type FetchPostCommentsResponse,
  type PostCommentListItem,
} from "../services/client/fetchPostCommentsApi";

export type CommentRepliesQueryData = {
  pages: FetchPostCommentsResponse[];
  pageParams: Array<string | undefined>;
  items: PostCommentListItem[];
};

export const commentRepliesQueryKey = (
  postId: string,
  parentId: string | null
) => ["commentReplies", { postId, parentId }] as const;

type CommentRepliesQueryKey = ReturnType<typeof commentRepliesQueryKey>;

type UseCommentRepliesOptions = {
  postId: string;
  parentId: string;
  limit?: number;
  enabled?: boolean;
};

export function useCommentReplies({
  postId,
  parentId,
  limit,
  enabled = true,
}: UseCommentRepliesOptions) {
  const queryKey = commentRepliesQueryKey(postId, parentId);
  const isEnabled = enabled && Boolean(postId) && Boolean(parentId);

  return useInfiniteQuery<
    FetchPostCommentsResponse,
    Error,
    CommentRepliesQueryData,
    CommentRepliesQueryKey,
    string | undefined
  >({
    queryKey,
    enabled: isEnabled,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      fetchPostCommentsRequest({
        postId,
        parentId,
        limit,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams as Array<string | undefined>,
      items: data.pages.flatMap((page) => page.comments),
    }),
    refetchOnReconnect: true,
  });
}
