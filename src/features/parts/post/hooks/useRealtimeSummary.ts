"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/hooks";
import { buildUserChannel } from "@/features/utils/realtime";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import {
  POST_META_EVENT,
  type BroadcastPostMetaInput,
} from "../events/postMetaEvent";
import {
  POST_DETAIL_COMMENT_EVENT,
  POST_DETAIL_META_EVENT,
  POST_DETAIL_REPLY_EVENT,
  buildPostDetailChannel,
} from "../utils/realtime/channels";

import { applyCacheUpdates } from "./useRealtimeSummary/metaCache";
import { applyPostDetailCommentUpdate } from "./useRealtimeSummary/commentCache";
import type {
  PostDetailCommentEventPayload,
  PostDetailMetaEventPayload,
  ReactionSummaryUpdatePayload,
  UseRealtimeSummaryOptions,
} from "./useRealtimeSummary/types";

export function useRealtimeSummary(options: UseRealtimeSummaryOptions = {}) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { postId } = options;

  const applyUpdate = useCallback(
    (payload: ReactionSummaryUpdatePayload) => {
      applyCacheUpdates(queryClient, payload);
    },
    [queryClient]
  );

  const userChannelName = currentUser?.id
    ? buildUserChannel(currentUser.id)
    : null;
  const shouldListenToUserChannel =
    Boolean(userChannelName) && options.enableUserChannel !== false;

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

  const detailChannelName = postId ? buildPostDetailChannel(postId) : null;
  const shouldListenToPostDetailChannel =
    Boolean(detailChannelName) &&
    (options.enablePostDetailChannel ?? Boolean(postId));

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

  const handleCommentEvent = useCallback(
    (payload: PostDetailCommentEventPayload) => {
      applyPostDetailCommentUpdate(queryClient, payload);
    },
    [queryClient]
  );

  usePusherChannel<PostDetailCommentEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: shouldListenToPostDetailChannel,
    event: POST_DETAIL_COMMENT_EVENT,
    onEvent: handleCommentEvent,
  });

  // usePusherChannel<PostDetailCommentEventPayload>({
  //   channelName: detailChannelName ?? "",
  //   enabled: shouldListenToPostDetailChannel,
  //   event: POST_DETAIL_REPLY_EVENT,
  //   onEvent: handleCommentEvent,
  // });
}
