"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { fetchPostDetailsRequest } from "../services/client/fetchPostDetailsApi";

export const postDetailsQueryKey = (postId: string) =>
  ["postDetails", { postId }] as const;

type UsePostDetailsOptions = {
  postId: string;
  enabled: boolean;
};

export function usePostDetails({
  postId,
  enabled = true,
}: UsePostDetailsOptions) {
  return useQuery<FeedPost, Error>({
    queryKey: postDetailsQueryKey(postId),
    queryFn: async () => fetchPostDetailsRequest(postId),
    enabled: enabled && Boolean(postId),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
