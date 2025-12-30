"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ClientSession } from "@/utils/session";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { FollowRealtimePayload } from "../utils/realtime";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import {
  createFollowRealtimeHandlers,
  type FollowRealtimeHandlers,
} from "./realtime/followRealtimeHandlers";
import {
  buildFollowRealtimeBindings,
  FollowRealtimeBinding,
} from "./realtime/followRealtimeBindings";

const USER_CHANNEL_PREFIX = "private-user-";

export function useFollowRealtime(profileUsername?: string) {
  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";
  const queryClient = useQueryClient();

  const profileKey = useMemo(() => {
    if (!profileUsername) {
      return null;
    }

    return profileQueryKey(profileUsername);
  }, [profileUsername]);

  const handlers = useMemo<FollowRealtimeHandlers | null>(() => {
    if (!profileUsername || !profileKey) {
      return null;
    }

    return createFollowRealtimeHandlers({
      profileUsername,
      profileKey,
      queryClient,
    });
  }, [profileKey, profileUsername, queryClient]);

  const bindings = useMemo<FollowRealtimeBinding[]>(() => {
    if (!handlers) {
      return [];
    }

    return buildFollowRealtimeBindings(handlers);
  }, [handlers]);

  usePusherChannel<FollowRealtimePayload>({
    channelName: userId ? `${USER_CHANNEL_PREFIX}${userId}` : "",
    bindings,
    enabled: Boolean(userId && profileUsername && bindings.length > 0),
  });
}
