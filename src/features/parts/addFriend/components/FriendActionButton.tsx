"use client";

import { useMutationState } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useCancelFriendRequest } from "../hooks/useCancelFriendRequest";
import { AcceptRejectFriendButtons } from "./AcceptRejectFriendButtons";
import { useUnFriend } from "../hooks/useUnFriend";
import { useFriendRealtime } from "../hooks/useFriendRealtime";
import {
  cancelFriendRequestMutationKey,
  sendFriendRequestMutationKey,
  unFriendMutationKey,
} from "../hooks";

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
  const sendFriendRequest = useFriendRequest({ profileUsername });
  const cancelFriendRequest = useCancelFriendRequest({ profileUsername });
  const unFriend = useUnFriend({ profileUsername });

  useFriendRealtime(profileUsername);

  const sharedSendPending = useMutationState({
    filters: {
      mutationKey: sendFriendRequestMutationKey(profileUsername),
      status: "pending",
    },
  });
  const sharedCancelPending = useMutationState({
    filters: {
      mutationKey: cancelFriendRequestMutationKey(profileUsername),
      status: "pending",
    },
  });
  const sharedUnfriendPending = useMutationState({
    filters: {
      mutationKey: unFriendMutationKey(profileUsername),
      status: "pending",
    },
  });

  const sendIsPending =
    sendFriendRequest.isPending || sharedSendPending.length > 0;
  const cancelIsPending =
    cancelFriendRequest.isPending || sharedCancelPending.length > 0;
  const unFriendIsPending =
    unFriend.isPending || sharedUnfriendPending.length > 0;

  if (viewer.isSelf) {
    return null;
  }

  if (viewer.isFriend) {
    const removeDisabled = isBlocked || unFriendIsPending || sendIsPending;

    return (
      <Button
        type="button"
        disabled={removeDisabled}
        aria-live="polite"
        aria-label="unfriend user"
        data-testid="profile-action-unfriend"
        onClick={() => {
          if (removeDisabled) {
            return;
          }

          unFriend.mutate();
        }}
      >
        {unFriendIsPending ? "removing…" : "unfriend"}
      </Button>
    );
  }

  if (viewer.hasIncomingFriendRequest) {
    return (
      <AcceptRejectFriendButtons
        profileUsername={profileUsername}
        isBlocked={isBlocked}
      />
    );
  }

  const friendState = getFriendState(viewer, isBlocked);

  const isDisabled =
    friendState.disabled ||
    viewer.isSelf ||
    isBlocked ||
    sendIsPending ||
    cancelIsPending;

  const buttonLabel = friendState.label;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }

    if (viewer.hasOutgoingFriendRequest) {
      if (!cancelIsPending) {
        cancelFriendRequest.mutate();
      }
      return;
    }

    if (!sendIsPending) {
      sendFriendRequest.mutate();
    }
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
