"use client";

import { useMutationState } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAcceptFriendRequest } from "../hooks/useAcceptFriendRequest";
import { useRejectFriendRequest } from "../hooks/useRejectFriendRequest";
import {
  acceptFriendRequestMutationKey,
  rejectFriendRequestMutationKey,
} from "../hooks";

export type AcceptRejectFriendButtonsProps = {
  profileUsername: string;
  isBlocked?: boolean;
  className?: string;
};

export function AcceptRejectFriendButtons({
  profileUsername,
  isBlocked = false,
  className,
}: AcceptRejectFriendButtonsProps) {
  const acceptFriendRequest = useAcceptFriendRequest({ profileUsername });
  const rejectFriendRequest = useRejectFriendRequest({ profileUsername });

  const sharedAcceptPending = useMutationState({
    filters: {
      mutationKey: acceptFriendRequestMutationKey(profileUsername),
      status: "pending",
    },
  });

  const sharedRejectPending = useMutationState({
    filters: {
      mutationKey: rejectFriendRequestMutationKey(profileUsername),
      status: "pending",
    },
  });

  const acceptIsPending =
    acceptFriendRequest.isPending || sharedAcceptPending.length > 0;
  const rejectIsPending =
    rejectFriendRequest.isPending || sharedRejectPending.length > 0;

  const acceptDisabled = isBlocked || acceptIsPending || rejectIsPending;
  const rejectDisabled = isBlocked || acceptIsPending || rejectIsPending;

  return (
    <div
      className={cn("flex items-center gap-2 justify-center", className)}
      data-testid="profile-action-friend-request"
    >
      <Button
        type="button"
        variant="accept"
        disabled={acceptDisabled}
        size="sm"
        aria-live="polite"
        aria-label="accept friend request"
        onClick={() => {
          if (acceptDisabled) {
            return;
          }

          acceptFriendRequest.mutate();
        }}
      >
        {acceptIsPending ? "accepting…" : "accept"}
      </Button>
      <Button
        type="button"
        variant="reject"
        disabled={rejectDisabled}
        size="sm"
        aria-live="polite"
        aria-label="reject friend request"
        onClick={() => {
          if (rejectDisabled) {
            return;
          }

          rejectFriendRequest.mutate();
        }}
      >
        {rejectIsPending ? "rejecting…" : "reject"}
      </Button>
    </div>
  );
}
