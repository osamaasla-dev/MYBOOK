"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useSendFriendRequest } from "../hooks/useFriendRequest";
import { useCancelFriendRequest } from "../hooks/useCancelFriendRequest";

function getFriendState(
  viewer: ProfileRouteData["viewer"],
  isBlocked: boolean
) {
  if (isBlocked) {
    return { label: "blocked", disabled: true } as const;
  }

  if (viewer.isFriend) {
    return { label: "unfriend", disabled: true } as const;
  }

  if (viewer.hasOutgoingFriendRequest) {
    return { label: "cancel request", disabled: false } as const;
  }

  if (viewer.hasIncomingFriendRequest) {
    return { label: "accept friend request", disabled: false } as const;
  }

  return { label: "add friend", disabled: false } as const;
}

export type FriendActionButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: ProfileRouteData["profile"]["username"];
  isBlocked: boolean;
};

export function FriendActionButton({
  viewer,
  profileUsername,
  isBlocked,
}: FriendActionButtonProps) {
  const sendFriendRequest = useSendFriendRequest({ profileUsername });
  const cancelFriendRequest = useCancelFriendRequest({ profileUsername });

  if (viewer.isSelf) {
    return null;
  }

  const friendState = getFriendState(viewer, isBlocked);

  const isDisabled =
    friendState.disabled ||
    viewer.isSelf ||
    isBlocked ||
    sendFriendRequest.isPending ||
    cancelFriendRequest.isPending;

  const buttonLabel = friendState.label;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }

    if (viewer.hasOutgoingFriendRequest) {
      cancelFriendRequest.mutate();
      return;
    }

    sendFriendRequest.mutate();
  };

  return (
    <Button
      type="button"
      disabled={isDisabled}
      aria-live="polite"
      aria-label={`friend status: ${buttonLabel}`}
      data-testid="profile-action-friend"
      onClick={handleClick}
    >
      {buttonLabel}
    </Button>
  );
}
