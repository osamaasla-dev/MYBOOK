"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ClientSession } from "@/utils/session";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import {
  createFriendRealtimeHandlers,
  type FriendRealtimeHandlers,
} from "./friendRealtimeHandlers";
import {
  buildFriendRealtimeBindings,
  type FriendRealtimeBinding,
} from "./friendRealtimeBindings";
import { FriendRealtimePayload } from "../../utils";

const USER_CHANNEL_PREFIX = "private-user-";

export function useFriendRealtime(profileUsername?: string) {
  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";
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
    channelName: userId ? `${USER_CHANNEL_PREFIX}${userId}` : "",
    bindings,
    enabled: Boolean(userId && profileUsername && bindings.length > 0),
  });
}
