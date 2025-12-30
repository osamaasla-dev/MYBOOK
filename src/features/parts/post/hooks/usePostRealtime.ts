"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import type { usePostRealtimeOptions } from "./usePostRealtime/types";
import { usePostMetaRealtime } from "./usePostRealtime/postMetaRealtime";
import { usePostDetailCommentRealtime } from "./usePostRealtime/commentRealtime";
import { ClientSession } from "@/utils/session";

export function usePostRealtime(options: usePostRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";
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
      userId,
      postId: postId ?? undefined,
      enableUserChannel,
      enablePostDetailChannel,
    });

  usePostDetailCommentRealtime({
    queryClient,
    detailChannelName,
    enabled: shouldListenToPostDetailChannel,
    currentUserId: userId,
  });
}
