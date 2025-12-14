import type { QueryClient } from "@tanstack/react-query";

import type { FollowRealtimePayload } from "../../utils/realtime";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import type { profileQueryKey } from "@/features/pages/profile/hooks/useProfile";

export type FollowRealtimeHandler = (payload: FollowRealtimePayload) => void;

export type FollowRealtimeHandlers = {
  onFollowApproved: FollowRealtimeHandler;
  onFollowRejected: FollowRealtimeHandler;
  onFollowerRemoved: FollowRealtimeHandler;
  onFollowAdded: FollowRealtimeHandler;
  onFollowRemoved: FollowRealtimeHandler;
};

type CreateHandlersArgs = {
  profileUsername?: string;
  profileKey?: ReturnType<typeof profileQueryKey>;
  queryClient: QueryClient;
};

export function createFollowRealtimeHandlers({
  profileUsername,
  profileKey,
  queryClient,
}: CreateHandlersArgs): FollowRealtimeHandlers {
  const ensureSameFollower = (payload: FollowRealtimePayload) =>
    !profileUsername || payload.followerUsername === profileUsername;

  const updateProfileViewer = (
    updater: (viewer: ProfileRouteData["viewer"]) => ProfileRouteData["viewer"]
  ) => {
    if (!profileKey) {
      return;
    }

    queryClient.setQueryData<ProfileRouteData>(profileKey, (previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        viewer: updater(previous.viewer),
      };
    });
  };

  return {
    onFollowApproved: (payload) => {
      if (!profileUsername || !profileKey) {
        return;
      }

      if (!ensureSameFollower(payload)) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: profileKey });
    },
    onFollowRejected: (payload) => {
      console.log("ghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");

      if (!profileUsername) {
        return;
      }

      if (!ensureSameFollower(payload)) {
        return;
      }

      updateProfileViewer((viewer) => ({
        ...viewer,
        hasPendingFollowRequest: false,
      }));
    },
    onFollowerRemoved: (payload) => {
      if (!profileUsername) {
        return;
      }

      if (!ensureSameFollower(payload)) {
        return;
      }

      updateProfileViewer((viewer) => ({
        ...viewer,
        isFollowing: false,
        hasPendingFollowRequest: false,
      }));
    },
    onFollowAdded: (payload) => {
      if (!profileUsername) {
        return;
      }

      if (!ensureSameFollower(payload) || payload.kind !== "follow") {
        return;
      }

      updateProfileViewer((viewer) => ({
        ...viewer,
        isFollower: true,
      }));
    },
    onFollowRemoved: (payload) => {
      if (!profileUsername) {
        return;
      }

      if (!ensureSameFollower(payload) || payload.kind !== "unfollow") {
        return;
      }

      updateProfileViewer((viewer) => ({
        ...viewer,
        isFollower: false,
      }));
    },
  };
}
