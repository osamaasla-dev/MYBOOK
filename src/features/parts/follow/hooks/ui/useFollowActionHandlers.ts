import { useCallback } from "react";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useFollowActionLoading } from "./useFollowActionLoading";
import { useFollowRequestLoading } from "./useFollowActionLoading";
import { useRemoveFollowerLoading } from "./useFollowActionLoading";
import type { FollowActionState } from "./useFollowActionState";

// Hook for main follow action handlers
export function useFollowActionHandlers(
  viewer: ProfileRouteData["viewer"],
  profileUsername: string,
  actionState: FollowActionState
) {
  const {
    followMutation,
    unfollowMutation,
    cancelRequestMutation,
    followIsPending,
    unfollowIsPending,
    cancelIsPending,
  } = useFollowActionLoading(profileUsername);

  const isDisabled =
    actionState.disabled ||
    followIsPending ||
    unfollowIsPending ||
    cancelIsPending;

  const handleFollowToggle = useCallback(() => {
    if (isDisabled) {
      return;
    }
    const payload = { username: profileUsername };

    switch (actionState.action) {
      case "follow":
        if (!followIsPending) {
          followMutation.mutate(payload);
        }
        break;
      case "unfollow":
        if (!unfollowIsPending) {
          unfollowMutation.mutate(payload);
        }
        break;
      case "cancel-request":
        if (!cancelIsPending) {
          cancelRequestMutation.mutate(payload);
        }
        break;
      default:
        break;
    }
  }, [
    isDisabled,
    actionState.action,
    followIsPending,
    unfollowIsPending,
    cancelIsPending,
    followMutation,
    unfollowMutation,
    cancelRequestMutation,
    profileUsername,
  ]);

  return {
    handleFollowToggle,
    isDisabled,
    followIsPending,
    unfollowIsPending,
    cancelIsPending,
  };
}

// Hook for follow request action handlers
export function useFollowRequestHandlers(username: string) {
  const { acceptMutation, rejectMutation, acceptIsPending, rejectIsPending } =
    useFollowRequestLoading(username);

  const acceptDisabled = acceptIsPending || rejectIsPending;
  const rejectDisabled = acceptIsPending || rejectIsPending;

  const handleAccept = useCallback(() => {
    if (acceptDisabled) {
      return;
    }
    acceptMutation.mutate({ username });
  }, [acceptDisabled, acceptMutation, username]);

  const handleReject = useCallback(() => {
    if (rejectDisabled) {
      return;
    }
    rejectMutation.mutate({ username });
  }, [rejectDisabled, rejectMutation, username]);

  return {
    handleAccept,
    handleReject,
    acceptDisabled,
    rejectDisabled,
    acceptIsPending,
    rejectIsPending,
  };
}

// Hook for remove follower handler
export function useRemoveFollowerHandler(username: string) {
  const { removeFollowerMutation, isPending } =
    useRemoveFollowerLoading(username);

  const handleRemoveFollower = useCallback(() => {
    if (isPending) {
      return;
    }
    removeFollowerMutation.mutate({ username });
  }, [isPending, removeFollowerMutation, username]);

  return {
    handleRemoveFollower,
    isPending,
  };
}
