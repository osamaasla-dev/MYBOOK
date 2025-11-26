"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/hooks/useCurrentUser";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { FollowRealtimePayload } from "@/features/parts/follow/utils";
import type { RelationTab } from "../types";
import { relationsQueryKey } from "./useRelationsInfiniteList";

const USER_CHANNEL_PREFIX = "private-user-";
const FOLLOW_REQUEST_TABS: RelationTab[] = [
  "follow-requests",
  "sent-follow-requests",
];

export function useRelationsRealtime() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const handleFollowRequestUpdate = useCallback(() => {
    FOLLOW_REQUEST_TABS.forEach((tab) => {
      queryClient.invalidateQueries({
        queryKey: relationsQueryKey(tab),
      });
    });
  }, [queryClient]);

  const handleFollowersRemoved = useCallback(
    (payload: FollowRealtimePayload) => {
      if (payload.kind !== "unfollow") {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: relationsQueryKey("followers"),
      });
    },
    [queryClient]
  );

  const handleFollowersAdded = useCallback(
    (payload: FollowRealtimePayload) => {
      if (payload.kind !== "follow") {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: relationsQueryKey("followers"),
      });
    },
    [queryClient]
  );

  const handleFollowingUpdate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: relationsQueryKey("following"),
    });
  }, [queryClient]);

  const channelName = currentUser?.id
    ? `${USER_CHANNEL_PREFIX}${currentUser.id}`
    : "";
  const enabled = Boolean(currentUser?.id);

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follow:requested",
    enabled,
    onEvent: handleFollowRequestUpdate,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follow:canceled",
    enabled,
    onEvent: handleFollowRequestUpdate,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follow:approved",
    enabled,
    onEvent: handleFollowRequestUpdate,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follow:rejected",
    enabled,
    onEvent: handleFollowRequestUpdate,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follow:added",
    enabled,
    onEvent: handleFollowersAdded,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follow:removed",
    enabled,
    onEvent: handleFollowersRemoved,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    event: "follower:removed",
    enabled,
    onEvent: handleFollowingUpdate,
  });
}
