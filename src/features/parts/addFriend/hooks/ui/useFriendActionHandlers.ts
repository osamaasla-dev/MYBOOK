import { useCallback } from "react";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useFriendActionLoading } from "./useFriendActionLoading";
import type { FriendActionState } from "./useFriendActionState";

export function useFriendActionHandlers(
  viewer: ProfileRouteData["viewer"],
  profileUsername: string,
  actionState: FriendActionState,
  isBlocked: boolean
) {
  const {
    sendIsPending,
    cancelIsPending,
    unFriendIsPending,
    sendFriendRequest,
    cancelFriendRequest,
    unFriend,
  } = useFriendActionLoading(profileUsername);

  const handleClick = useCallback(() => {
    if (actionState.disabled || isBlocked || viewer.isSelf) {
      return;
    }

    switch (actionState.action) {
      case "cancel":
        if (!cancelIsPending) {
          cancelFriendRequest.mutate();
        }
        break;
      case "send":
        if (!sendIsPending) {
          sendFriendRequest.mutate();
        }
        break;
      case "unfriend":
        if (!unFriendIsPending) {
          unFriend.mutate();
        }
        break;
      case "none":
      default:
        break;
    }
  }, [
    actionState.action,
    actionState.disabled,
    isBlocked,
    viewer.isSelf,
    cancelIsPending,
    sendIsPending,
    unFriendIsPending,
    cancelFriendRequest,
    sendFriendRequest,
    unFriend,
  ]);

  const handleUnfriendClick = useCallback(() => {
    const removeDisabled = isBlocked || unFriendIsPending || sendIsPending;
    if (removeDisabled) {
      return;
    }
    unFriend.mutate();
  }, [isBlocked, unFriendIsPending, sendIsPending, unFriend]);

  return {
    handleClick,
    handleUnfriendClick,
    sendIsPending,
    cancelIsPending,
    unFriendIsPending,
  };
}
