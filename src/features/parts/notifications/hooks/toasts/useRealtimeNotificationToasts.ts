"use client";

import { useMemo } from "react";

import { useCurrentUser } from "@/features/hooks";
import { buildUserChannel } from "@/features/utils/realtime";
import {
  usePusherChannel,
  type UsePusherBinding,
} from "@/hooks/usePusherChannel";

import { buildFollowToastBindings } from "./followToastBindings";
import { buildFriendToastBindings } from "./friendToastBindings";
import { buildPostToastBindings } from "./postToastBindings";
import { buildReactionToastBindings } from "./reactionToastBindings";
import { usePostDetailsModalNavigation } from "@/features/parts/postDetails/hooks";

export function useRealtimeNotificationToasts() {
  const { data: currentUser } = useCurrentUser();
  const { currentPostId, isPostDetailsOpen } = usePostDetailsModalNavigation();

  const postModalContext = useMemo(
    () => ({
      isPostModalOpenFor: (postId?: string | null) =>
        Boolean(isPostDetailsOpen && currentPostId && postId === currentPostId),
    }),
    [currentPostId, isPostDetailsOpen]
  );

  const staticBindings = useMemo<UsePusherBinding<unknown>[]>(() => {
    try {
      return [
        ...buildFollowToastBindings(),
        ...buildFriendToastBindings(),
        ...buildPostToastBindings(),
      ];
    } catch (error) {
      console.error("Failed to build notification toast bindings", error);
      return [];
    }
  }, []);

  const reactionBindings = useMemo<UsePusherBinding<unknown>[]>(() => {
    try {
      return buildReactionToastBindings({ context: postModalContext });
    } catch (error) {
      console.error("Failed to build reaction toast bindings", error);
      return [];
    }
  }, [postModalContext]);

  const bindings = useMemo<UsePusherBinding<unknown>[]>(() => {
    return [...staticBindings, ...reactionBindings];
  }, [reactionBindings, staticBindings]);

  const channelName = currentUser?.id ? buildUserChannel(currentUser.id) : "";

  usePusherChannel({
    channelName,
    bindings,
    enabled: Boolean(channelName && bindings.length),
  });
}
