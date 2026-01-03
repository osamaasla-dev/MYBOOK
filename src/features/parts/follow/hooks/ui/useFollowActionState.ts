import { useMemo } from "react";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type FollowActionState = {
  label: "follow" | "unfollow" | "cancel request" | "blocked";
  action: "follow" | "unfollow" | "cancel-request" | "none";
  disabled: boolean;
};

export function useFollowActionState(
  viewer: ProfileRouteData["viewer"],
  isBlocked: boolean
): FollowActionState {
  return useMemo(() => {
    if (isBlocked) {
      return { label: "blocked", action: "none", disabled: true } as const;
    }

    if (viewer.hasPendingFollowRequest) {
      return {
        label: "cancel request",
        action: "cancel-request",
        disabled: false,
      } as const;
    }

    if (viewer.isFollowing) {
      return {
        label: "unfollow",
        action: "unfollow",
        disabled: false,
      } as const;
    }

    return { label: "follow", action: "follow", disabled: false } as const;
  }, [viewer.isFollowing, viewer.hasPendingFollowRequest, isBlocked]);
}
