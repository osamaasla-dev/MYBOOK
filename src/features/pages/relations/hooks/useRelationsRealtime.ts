"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/hooks";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { FollowRealtimePayload } from "@/features/parts/follow/utils";
import type { FriendRealtimePayload } from "@/features/parts/addFriend/utils/realtime";
import type { RelationTab } from "../types";
import {
  USER_CHANNEL_PREFIX,
  FOLLOW_EVENT_CONFIG,
  FRIEND_EVENT_CONFIG,
  type RelationEventBinding,
} from "./realtime/relationsRealtime.constants";
import { invalidateRelationTabs } from "./realtime/relationsRealtime.helpers";

export function useRelationsRealtime() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const invalidateTabs = useCallback(
    (tabs: readonly RelationTab[]) => {
      invalidateRelationTabs(queryClient, tabs);
    },
    [queryClient]
  );

  const buildBindings = useCallback(
    (events: readonly RelationEventBinding[]) =>
      events.map(({ event, tabs }) => ({
        event,
        onEvent: () => invalidateTabs(tabs),
      })),
    [invalidateTabs]
  );

  const channelName = currentUser?.id
    ? `${USER_CHANNEL_PREFIX}${currentUser.id}`
    : "";

  const followBindings = useMemo(
    () => buildBindings(FOLLOW_EVENT_CONFIG),
    [buildBindings]
  );

  const friendBindings = useMemo(
    () => buildBindings(FRIEND_EVENT_CONFIG),
    [buildBindings]
  );

  usePusherChannel<FollowRealtimePayload>({
    channelName,
    bindings: followBindings,
  });

  usePusherChannel<FriendRealtimePayload>({
    channelName,
    bindings: friendBindings,
  });
}
