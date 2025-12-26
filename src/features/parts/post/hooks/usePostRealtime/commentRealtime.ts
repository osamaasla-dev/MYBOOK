"use client";

import { useCallback, useMemo } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { usePusherChannel } from "@/hooks/usePusherChannel";

import {
  POST_DETAIL_COMMENT_DELETED_EVENT,
  POST_DETAIL_COMMENT_EVENT,
  POST_DETAIL_COMMENT_UPDATED_EVENT,
  POST_DETAIL_COMMENT_META_EVENT,
} from "../../utils/realtime/channels";

import {
  applyPostDetailCommentDeletedUpdate,
  applyPostDetailCommentUpdate,
  applyPostDetailCommentEditedUpdate,
  applyCommentMetaUpdate,
} from "./commentCache";
import type {
  CommentMetaEventPayload,
  PostDetailCommentDeletedEventPayload,
  PostDetailCommentEventPayload,
  PostDetailCommentUpdatedEventPayload,
} from "./types";

type CommentRealtimeOptions = {
  queryClient: QueryClient;
  detailChannelName: string | null;
  enabled: boolean;
  currentUserId?: string;
};

export function usePostDetailCommentRealtime({
  queryClient,
  detailChannelName,
  enabled,
  currentUserId,
}: CommentRealtimeOptions) {
  const isChannelActive = useMemo(
    () => Boolean(detailChannelName) && enabled,
    [detailChannelName, enabled]
  );

  // Prevent duplicate handlers in strict mode
  const handleCommentEvent = useCallback(
    (payload: PostDetailCommentEventPayload) => {
      if (!payload.postId || !payload.commentId) {
        return;
      }

      console.log("Comment event received:", payload.commentId);
      applyPostDetailCommentUpdate(queryClient, payload, currentUserId);
    },
    [queryClient, currentUserId]
  );

  usePusherChannel<PostDetailCommentEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: isChannelActive,
    event: POST_DETAIL_COMMENT_EVENT,
    onEvent: handleCommentEvent,
  });

  const handleCommentDeletedEvent = useCallback(
    (payload: PostDetailCommentDeletedEventPayload) => {
      console.log("Comment deleted event received:", payload.commentId);
      applyPostDetailCommentDeletedUpdate(queryClient, payload, currentUserId);
    },
    [queryClient]
  );

  usePusherChannel<PostDetailCommentDeletedEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: isChannelActive,
    event: POST_DETAIL_COMMENT_DELETED_EVENT,
    onEvent: handleCommentDeletedEvent,
  });

  const handleCommentUpdatedEvent = useCallback(
    (payload: PostDetailCommentUpdatedEventPayload) => {
      console.log("Comment updated event received:", payload.commentId);
      applyPostDetailCommentEditedUpdate(queryClient, payload, currentUserId);
    },
    [queryClient]
  );

  usePusherChannel<PostDetailCommentUpdatedEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: isChannelActive,
    event: POST_DETAIL_COMMENT_UPDATED_EVENT,
    onEvent: handleCommentUpdatedEvent,
  });

  const handleCommentMetaEvent = useCallback(
    (payload: CommentMetaEventPayload) => {
      console.log("Comment meta event received:", payload.commentId);
      applyCommentMetaUpdate(queryClient, payload, currentUserId);
    },
    [queryClient]
  );

  usePusherChannel<CommentMetaEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: isChannelActive,
    event: POST_DETAIL_COMMENT_META_EVENT,
    onEvent: handleCommentMetaEvent,
  });
}
