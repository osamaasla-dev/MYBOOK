"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { usePostRealtimeOptions } from "./usePostRealtime/types";
import { usePostMetaRealtime } from "./usePostRealtime/postMetaRealtime";
import { usePostDetailCommentRealtime } from "./usePostRealtime/commentRealtime";
import { ClientSession } from "@/utils/session";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import { buildUserChannel } from "@/features/utils/realtime";
import {
  BLOCK_CREATED_EVENT,
  BLOCK_REMOVED_EVENT,
  type BlockRealtimePayload,
} from "@/features/parts/block/utils/realtimeEvents";
import { invalidateBlockRelatedQueries } from "@/features/parts/block/hooks/utils/invalidateBlockQueries";

export function usePostRealtime(options: usePostRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";
  const initializedRef = useRef(false);
  const pathname = usePathname();

  const postId = options.postId ?? null;

  const enableUserChannel = options.enableUserChannel ?? true;
  const enablePostDetailChannel =
    options.enablePostDetailChannel ?? Boolean(postId);

  const profileUsernameFromPath = useMemo(() => {
    if (!pathname) return null;
    const segments = pathname.split("/").filter(Boolean);
    const profileIndex = segments.findIndex((segment) => segment === "profile");
    if (profileIndex === -1) return null;
    return segments[profileIndex + 1] ?? null;
  }, [pathname]);

  const userChannelName = useMemo(
    () => (userId ? buildUserChannel(userId) : null),
    [userId]
  );

  const handleBlockEvent = useCallback(
    async (payload: BlockRealtimePayload) => {
      const relatedUsername =
        payload.blockerUsername ??
        payload.blockedUsername ??
        profileUsernameFromPath ??
        null;

      await invalidateBlockRelatedQueries(queryClient, relatedUsername);
    },
    [profileUsernameFromPath, queryClient]
  );

  const blockBindings = useMemo(
    () => [
      {
        event: BLOCK_CREATED_EVENT,
        onEvent: (payload: BlockRealtimePayload) => {
          void handleBlockEvent(payload);
        },
      },
      {
        event: BLOCK_REMOVED_EVENT,
        onEvent: (payload: BlockRealtimePayload) => {
          void handleBlockEvent(payload);
        },
      },
    ],
    [handleBlockEvent]
  );

  const shouldListenToBlockEvents =
    Boolean(userChannelName) && enableUserChannel && Boolean(userId);

  usePusherChannel<BlockRealtimePayload>({
    channelName: userChannelName ?? "",
    bindings: blockBindings,
    enabled: shouldListenToBlockEvents,
  });

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
