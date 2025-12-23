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
};

export function usePostDetailCommentRealtime({
  queryClient,
  detailChannelName,
  enabled,
}: CommentRealtimeOptions) {
  const isChannelActive = useMemo(
    () => Boolean(detailChannelName) && enabled,
    [detailChannelName, enabled]
  );

  const handleCommentEvent = useCallback(
    (payload: PostDetailCommentEventPayload) => {
      applyPostDetailCommentUpdate(queryClient, payload);
    },
    [queryClient]
  );

  usePusherChannel<PostDetailCommentEventPayload>({
    channelName: detailChannelName ?? "",
    enabled: isChannelActive,
    event: POST_DETAIL_COMMENT_EVENT,
    onEvent: handleCommentEvent,
  });

  const handleCommentDeletedEvent = useCallback(
    (payload: PostDetailCommentDeletedEventPayload) => {
      applyPostDetailCommentDeletedUpdate(queryClient, payload);
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
      applyPostDetailCommentEditedUpdate(queryClient, payload);
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
      applyCommentMetaUpdate(queryClient, payload);
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
