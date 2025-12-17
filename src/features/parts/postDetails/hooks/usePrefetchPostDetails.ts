"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { postDetailsQueryKey } from "./usePostDetails";
import { fetchPostDetailsRequest } from "../services/client/fetchPostDetailsApi";

type UsePrefetchPostDetailsOptions = {
  postId?: string;
};

export function usePrefetchPostDetails({
  postId,
}: UsePrefetchPostDetailsOptions) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!postId) return;
    const existing = queryClient.getQueryData(postDetailsQueryKey(postId));

    if (existing) return;
    queryClient.prefetchQuery({
      queryKey: postDetailsQueryKey(postId),
      queryFn: () => fetchPostDetailsRequest(postId),
      staleTime: 30_000,
    });
  }, [postId, queryClient]);
}
