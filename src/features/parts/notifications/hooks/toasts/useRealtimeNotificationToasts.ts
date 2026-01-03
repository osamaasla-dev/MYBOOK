"use client";

import { useMemo } from "react";

import { buildUserChannel } from "@/features/utils/ratelimit";
import {
  usePusherChannel,
  type UsePusherBinding,
} from "@/hooks/usePusherChannel";

import { buildFollowToastBindings } from "./followToastBindings";
import { buildFriendToastBindings } from "./friendToastBindings";
import { buildPostToastBindings } from "./postToastBindings";
import { buildReactionToastBindings } from "./reactionToastBindings";
import { buildCommentToastBindings } from "./commentToastBindings";
import { usePostDetailsModalNavigation } from "@/features/parts/postDetails/hooks";
import { ClientSession } from "@/utils/session";

export function useRealtimeNotificationToasts() {
  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";
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

  const commentBindings = useMemo<UsePusherBinding<unknown>[]>(() => {
    try {
      return buildCommentToastBindings({ context: postModalContext });
    } catch (error) {
      console.error("Failed to build comment toast bindings", error);
      return [];
    }
  }, [postModalContext]);

  const bindings = useMemo<UsePusherBinding<unknown>[]>(() => {
    return [...staticBindings, ...reactionBindings, ...commentBindings];
  }, [commentBindings, reactionBindings, staticBindings]);

  const channelName = userId ? buildUserChannel(userId) : "";

  usePusherChannel({
    channelName,
    bindings,
    enabled: Boolean(channelName && bindings.length),
  });
}
