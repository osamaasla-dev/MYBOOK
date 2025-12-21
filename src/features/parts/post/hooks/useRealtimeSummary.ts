"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/hooks";

import type { UseRealtimeSummaryOptions } from "./useRealtimeSummary/types";
import { usePostMetaRealtime } from "./useRealtimeSummary/postMetaRealtime";
import { usePostDetailCommentRealtime } from "./useRealtimeSummary/commentRealtime";

export function useRealtimeSummary(options: UseRealtimeSummaryOptions = {}) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const postId = options.postId ?? null;

  const enableUserChannel = options.enableUserChannel ?? true;
  const enablePostDetailChannel =
    options.enablePostDetailChannel ?? Boolean(postId);

  const { detailChannelName, shouldListenToPostDetailChannel } =
    usePostMetaRealtime({
      queryClient,
      userId: currentUser?.id,
      postId: postId ?? undefined,
      enableUserChannel,
      enablePostDetailChannel,
    });

  usePostDetailCommentRealtime({
    queryClient,
    detailChannelName,
    enabled: shouldListenToPostDetailChannel,
  });
}
