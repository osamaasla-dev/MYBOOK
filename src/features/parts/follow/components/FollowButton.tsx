"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import {
  useFollowRealtime,
  useFollow,
  useUnfollow,
  useCancelFollowRequest,
} from "../hooks";

function getFollowState(
  viewer: ProfileRouteData["viewer"],
  isBlocked: boolean
) {
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
    return { label: "unfollow", action: "unfollow", disabled: false } as const;
  }
  return { label: "follow", action: "follow", disabled: false } as const;
}

export type FollowButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: string;
  isBlocked: boolean;
};

export function FollowButton({
  viewer,
  profileUsername,
  isBlocked,
}: FollowButtonProps) {
  useFollowRealtime(profileUsername);

  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();
  const cancelRequestMutation = useCancelFollowRequest();

  const followState = getFollowState(viewer, isBlocked);

  const handleFollowToggle = () => {
    if (followState.disabled) {
      return;
    }
    const payload = { username: profileUsername };

    switch (followState.action) {
      case "follow":
        followMutation.mutate(payload);
        break;
      case "unfollow":
        unfollowMutation.mutate(payload);
        break;
      case "cancel-request":
        cancelRequestMutation.mutate(payload);
        break;
      default:
        break;
    }
  };

  const isDisabled =
    followState.disabled ||
    followMutation.isPending ||
    unfollowMutation.isPending ||
    cancelRequestMutation.isPending;

  const buttonLabel = (() => {
    if (followState.action === "follow") {
      return "follow";
    }
    if (followState.action === "unfollow") {
      return "unfollow";
    }
    if (followState.action === "cancel-request") {
      return "cancel request";
    }
    return followState.label;
  })();

  return (
    <Button
      type="button"
      disabled={isDisabled}
      aria-live="polite"
      aria-label={`follow status: ${followState.label}`}
      data-testid="profile-action-follow"
      onClick={handleFollowToggle}
    >
      {buttonLabel}
    </Button>
  );
}
