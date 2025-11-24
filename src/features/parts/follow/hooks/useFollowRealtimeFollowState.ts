"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/hooks/useCurrentUser";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { FollowRealtimePayload } from "@/features/utils/realtime";
import { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";
import type { ProfileRouteData } from "@/features/pages/profile/types";

const USER_CHANNEL_PREFIX = "private-user-";

export function useFollowRealtimeFollowState(profileUsername?: string) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const handleFollowApproved = useCallback(
    (payload: FollowRealtimePayload) => {
      if (!profileUsername) {
        return;
      }

      if (payload.followerUsername !== profileUsername) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: profileQueryKey(profileUsername),
      });
    },
    [profileUsername, queryClient]
  );

  const handleFollowRejected = useCallback(
    (payload: FollowRealtimePayload) => {
      if (!profileUsername) {
        return;
      }

      if (payload.followerUsername !== profileUsername) {
        return;
      }

      queryClient.setQueryData<ProfileRouteData>(
        profileQueryKey(profileUsername),
        (previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            viewer: {
              ...previous.viewer,
              hasPendingFollowRequest: false,
            },
          };
        }
      );
    },
    [profileUsername, queryClient]
  );

  usePusherChannel<FollowRealtimePayload>({
    channelName: currentUser?.id
      ? `${USER_CHANNEL_PREFIX}${currentUser.id}`
      : "",
    event: "follow:approved",
    enabled: Boolean(currentUser?.id && profileUsername),
    onEvent: handleFollowApproved,
  });

  usePusherChannel<FollowRealtimePayload>({
    channelName: currentUser?.id
      ? `${USER_CHANNEL_PREFIX}${currentUser.id}`
      : "",
    event: "follow:rejected",
    enabled: Boolean(currentUser?.id && profileUsername),
    onEvent: handleFollowRejected,
  });
}
