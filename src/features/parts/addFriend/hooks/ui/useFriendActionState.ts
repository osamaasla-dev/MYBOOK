import { useMemo } from "react";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type FriendActionState = {
  label: "add friend" | "cancel request" | "unfriend" | "blocked";
  disabled: boolean;
  action: "send" | "cancel" | "unfriend" | "none";
};

export function useFriendActionState(
  viewer: ProfileRouteData["viewer"],
  isBlocked: boolean
): FriendActionState {
  return useMemo(() => {
    if (isBlocked) {
      return { label: "blocked", disabled: true, action: "none" } as const;
    }

    if (viewer.isFriend) {
      return { label: "unfriend", disabled: true, action: "unfriend" } as const;
    }

    if (viewer.hasOutgoingFriendRequest) {
      return {
        label: "cancel request",
        disabled: false,
        action: "cancel",
      } as const;
    }

    return { label: "add friend", disabled: false, action: "send" } as const;
  }, [viewer.isFriend, viewer.hasOutgoingFriendRequest, isBlocked]);
}
