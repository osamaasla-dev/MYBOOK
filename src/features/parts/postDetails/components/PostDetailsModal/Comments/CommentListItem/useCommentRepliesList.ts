"use client";

import { useCallback, useMemo, useState } from "react";

import { useCommentReplies } from "@/features/parts/postDetails/hooks/useReplies";
import type { PostCommentListItem } from "@/features/parts/postDetails/services/client/fetchPostCommentsApi";

type UseCommentRepliesListArgs = {
  commentId: string;
  postId: string;
  enabled: boolean;
};

export function useCommentRepliesList({
  commentId,
  postId,
  enabled,
}: UseCommentRepliesListArgs) {
  const [isViewingReplies, setIsViewingReplies] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommentReplies({
      postId,
      parentId: commentId ?? "",
      limit: 3,
      enabled,
    });

  const replies = useMemo<PostCommentListItem[]>(
    () => data?.items ?? [],
    [data]
  );

  const toggleReplies = useCallback(() => {
    setIsViewingReplies((prev) => !prev);
  }, []);

  const loadMoreReplies = useCallback(() => {
    if (hasNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return {
    replies,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isViewingReplies,
    toggleReplies,
    loadMoreReplies,
  };
}
