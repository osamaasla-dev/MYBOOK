import type { QueryClient } from "@tanstack/react-query";

import type { FriendRealtimePayload } from "../../utils/realtime";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import type { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";

export type FriendRealtimeHandler = (payload: FriendRealtimePayload) => void;

export type FriendRealtimeHandlers = {
  onFriendRequested: FriendRealtimeHandler;
  onFriendCanceled: FriendRealtimeHandler;
  onFriendAccepted: FriendRealtimeHandler;
  onFriendRejected: FriendRealtimeHandler;
  onFriendRemoved: FriendRealtimeHandler;
};

type CreateHandlersArgs = {
  profileUsername: string;
  profileKey: ReturnType<typeof profileQueryKey>;
  queryClient: QueryClient;
};

export function createFriendRealtimeHandlers({
  profileUsername,
  profileKey,
  queryClient,
}: CreateHandlersArgs): FriendRealtimeHandlers {
  const normalizedProfileUsername = profileUsername.toLowerCase();

  const matchesProfile = (payload: FriendRealtimePayload) =>
    payload.requesterUsername.toLowerCase() === normalizedProfileUsername;

  const updateProfile = (
    updater: (previous: ProfileRouteData) => ProfileRouteData
  ) => {
    queryClient.setQueryData<ProfileRouteData>(profileKey, (previous) => {
      if (!previous) {
        return previous;
      }

      return updater(previous);
    });
  };

  const updateViewer = (
    updater: (viewer: ProfileRouteData["viewer"]) => ProfileRouteData["viewer"]
  ) => {
    updateProfile((previous) => ({
      ...previous,
      viewer: updater(previous.viewer),
    }));
  };

  const invalidateProfileCache = () =>
    queryClient.invalidateQueries({ queryKey: profileKey });

  return {
    onFriendRequested: (payload) => {
      if (!matchesProfile(payload)) {
        return;
      }

      updateViewer((viewer) => ({
        ...viewer,
        hasIncomingFriendRequest: true,
        hasOutgoingFriendRequest: false,
        isFriend: false,
      }));
    },
    onFriendCanceled: (payload) => {
      if (!matchesProfile(payload)) {
        return;
      }

      updateViewer((viewer) => ({
        ...viewer,
        hasIncomingFriendRequest: false,
      }));
    },
    onFriendAccepted: (payload) => {
      if (!matchesProfile(payload)) {
        return;
      }

      void invalidateProfileCache();
    },
    onFriendRejected: (payload) => {
      if (!matchesProfile(payload)) {
        return;
      }

      updateViewer((viewer) => ({
        ...viewer,
        hasOutgoingFriendRequest: false,
      }));
    },
    onFriendRemoved: (payload) => {
      if (!matchesProfile(payload)) {
        return;
      }

      void invalidateProfileCache();
    },
  };
}
