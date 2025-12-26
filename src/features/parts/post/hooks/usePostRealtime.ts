"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { useCurrentUser } from "@/features/hooks";

import type { usePostRealtimeOptions } from "./usePostRealtime/types";
import { usePostMetaRealtime } from "./usePostRealtime/postMetaRealtime";
import { usePostDetailCommentRealtime } from "./usePostRealtime/commentRealtime";

export function usePostRealtime(options: usePostRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const initializedRef = useRef(false);

  const postId = options.postId ?? null;

  const enableUserChannel = options.enableUserChannel ?? true;
  const enablePostDetailChannel =
    options.enablePostDetailChannel ?? Boolean(postId);

  // Prevent re-initialization
  if (!initializedRef.current) {
    initializedRef.current = true;
  }

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
    currentUserId: currentUser?.id,
  });
}
