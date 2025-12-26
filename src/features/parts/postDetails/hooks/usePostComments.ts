"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  fetchPostCommentsRequest,
  type FetchPostCommentsResponse,
  type PostCommentListItem,
} from "../services/client/fetchPostCommentsApi";

export type PostCommentsQueryData = {
  pages: FetchPostCommentsResponse[];
  pageParams: Array<string | undefined>;
  items: PostCommentListItem[];
};

export const postCommentsQueryKey = (
  postId: string,
  parentId: string | null = null
) => ["postComments", { postId, parentId }] as const;

type PostCommentsQueryKey = ReturnType<typeof postCommentsQueryKey>;

type UsePostCommentsOptions = {
  postId: string;
  parentId?: string | null;
  limit?: number;
  enabled?: boolean;
};

export function usePostComments({
  postId,
  parentId = null,
  limit,
  enabled = true,
}: UsePostCommentsOptions) {
  const queryKey = postCommentsQueryKey(postId, parentId);
  const isEnabled = enabled && Boolean(postId);

  return useInfiniteQuery<
    FetchPostCommentsResponse,
    Error,
    PostCommentsQueryData,
    PostCommentsQueryKey,
    string | undefined
  >({
    queryKey,
    enabled: isEnabled,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) =>
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
