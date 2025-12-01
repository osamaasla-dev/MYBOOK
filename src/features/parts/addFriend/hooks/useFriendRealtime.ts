"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/hooks";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { FriendRealtimePayload } from "../utils/realtime";
import {
  createFriendRealtimeHandlers,
  type FriendRealtimeHandlers,
} from "./realtime/friendRealtimeHandlers";
import {
  buildFriendRealtimeBindings,
  type FriendRealtimeBinding,
} from "./realtime/friendRealtimeBindings";

const USER_CHANNEL_PREFIX = "private-user-";

export function useFriendRealtime(profileUsername?: string) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const profileKey = useMemo(() => {
    if (!profileUsername) {
      return null;
    }

    return profileQueryKey(profileUsername);
  }, [profileUsername]);

  const handlers = useMemo<FriendRealtimeHandlers | null>(() => {
    if (!profileUsername || !profileKey) {
      return null;
    }

    return createFriendRealtimeHandlers({
      profileUsername,
      profileKey,
      queryClient,
    });
  }, [profileKey, profileUsername, queryClient]);

  const bindings = useMemo<FriendRealtimeBinding[]>(() => {
    if (!handlers) {
      return [];
    }

    return buildFriendRealtimeBindings(handlers);
  }, [handlers]);

  usePusherChannel<FriendRealtimePayload>({
    channelName: currentUser?.id
      ? `${USER_CHANNEL_PREFIX}${currentUser.id}`
      : "",
    bindings,
    enabled: Boolean(currentUser?.id && profileUsername && bindings.length > 0),
  });
}
