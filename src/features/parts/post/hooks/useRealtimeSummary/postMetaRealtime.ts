"use client";

import { useCallback, useMemo } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { buildUserChannel } from "@/features/utils/realtime";
import { usePusherChannel } from "@/hooks/usePusherChannel";

import {
  POST_META_EVENT,
  type BroadcastPostMetaInput,
} from "../../events/postMetaEvent";
import {
  POST_DETAIL_META_EVENT,
  buildPostDetailChannel,
} from "../../utils/realtime/channels";

import { applyCacheUpdates } from "./postMetaCache";
import type {
  PostDetailMetaEventPayload,
  ReactionSummaryUpdatePayload,
} from "./types";

type PostMetaRealtimeOptions = {
  queryClient: QueryClient;
  userId?: string;
  postId?: string;
  enableUserChannel: boolean;
  enablePostDetailChannel: boolean;
};

export type PostMetaRealtimeResult = {
  detailChannelName: string | null;
  shouldListenToPostDetailChannel: boolean;
};

export function usePostMetaRealtime({
  queryClient,
  userId,
  postId,
  enableUserChannel,
  enablePostDetailChannel,
}: PostMetaRealtimeOptions): PostMetaRealtimeResult {
  const applyUpdate = useCallback(
    (payload: ReactionSummaryUpdatePayload) => {
      applyCacheUpdates(queryClient, payload);
    },
    [queryClient]
  );

  const userChannelName = useMemo(
    () => (userId ? buildUserChannel(userId) : null),
    [userId]
  );

  const shouldListenToUserChannel =
    Boolean(userChannelName) && enableUserChannel && Boolean(userId);

  usePusherChannel<BroadcastPostMetaInput>({
    channelName: userChannelName ?? "",
    enabled: shouldListenToUserChannel,
    event: POST_META_EVENT,
    onEvent: (payload) => {
      applyUpdate({
        postId: payload.postId,
        reactionSummary: payload.reactionSummary,
        reactionsCount: payload.reactionsCount,
        commentsCount: payload.commentsCount,
        sharesCount: payload.sharesCount,
      });
    },
  });

  const detailChannelName = useMemo(
    () => (postId ? buildPostDetailChannel(postId) : null),
    [postId]
  );

  const shouldListenToPostDetailChannel =
    Boolean(detailChannelName) && enablePostDetailChannel;

  usePusherChannel<PostDetailMetaEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: shouldListenToPostDetailChannel,
    event: POST_DETAIL_META_EVENT,
    onEvent: (payload) => {
      applyUpdate({
        postId: payload.postId,
        reactionSummary: payload.reactionSummary,
        reactionsCount: payload.reactionsCount,
        commentsCount: payload.commentsCount,
        sharesCount: payload.sharesCount,
      });
    },
  });

  return {
    detailChannelName,
    shouldListenToPostDetailChannel,
  };
}
