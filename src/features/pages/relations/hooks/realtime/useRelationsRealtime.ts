"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { FollowRealtimePayload } from "@/features/parts/follow/utils";
import type { FriendRealtimePayload } from "@/features/parts/addFriend/utils/realtime";
import type { RelationTab } from "../../types";
import {
  USER_CHANNEL_PREFIX,
  FOLLOW_EVENT_CONFIG,
  FRIEND_EVENT_CONFIG,
  type RelationEventBinding,
} from "./relationsRealtime.constants";
import { invalidateRelationTabs } from "./relationsRealtime.helpers";
import { ClientSession } from "@/utils/session";

export function useRelationsRealtime() {
  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";
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

  const channelName = userId ? `${USER_CHANNEL_PREFIX}${userId}` : "";

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
