"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "../types";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "@/features/parts/follow/hooks/useFollowActions";

function getFollowState(
  viewer: ProfileRouteData["viewer"],
  isBlocked: boolean
) {
  if (isBlocked) {
    return { label: "blocked", disabled: true };
  }
  if (viewer.hasPendingFollowRequest) {
    return { label: "pending", disabled: true };
  }
  if (viewer.isFollowing) {
    return { label: "unfollow", disabled: false };
  }
  return { label: "follow", disabled: false };
}

function getFriendState(
  viewer: ProfileRouteData["viewer"],
  isBlocked: boolean
) {
  if (viewer.isSelf) {
    return { label: "you", disabled: true };
  }
  if (isBlocked) {
    return { label: "blocked", disabled: true };
  }
  const isFriend = viewer.isFollower && viewer.isFollowing;
  if (isFriend) {
    return { label: "friends", disabled: true };
  }
  return { label: "add friend", disabled: false };
}

type ProfileActionsProps = {
  viewer: ProfileRouteData["viewer"];
  restrictions: ProfileRouteData["restrictions"];
  profileUsername: ProfileRouteData["profile"]["username"];
};

export function ProfileActions({
  viewer,
  restrictions,
  profileUsername,
}: ProfileActionsProps) {
  const isBlocked =
    viewer.isBlocked || restrictions?.reason === "PROFILE_BLOCKED";
  const followState = getFollowState(viewer, isBlocked);
  const friendState = getFriendState(viewer, isBlocked);

  const followMutation = useFollowUserMutation();
  const unfollowMutation = useUnfollowUserMutation();

  if (viewer.isSelf) {
    return null;
  }

  const isFollowing = viewer.isFollowing;

  const handleFollowToggle = () => {
    if (followState.disabled) {
      return;
    }

    const action = isFollowing ? unfollowMutation : followMutation;
    action.mutate({ username: profileUsername });
  };
  return (
    <section
      className="flex flex-wrap gap-3"
      aria-label="Profile actions"
      data-testid="profile-actions"
    >
      <Button
        type="button"
        disabled={
          followState.disabled ||
          followMutation.isPending ||
          unfollowMutation.isPending
        }
        aria-live="polite"
        aria-label={`follow status: ${followState.label}`}
        data-testid="profile-action-follow"
        onClick={handleFollowToggle}
      >
        {isFollowing ? "unfollow" : followState.label}
      </Button>
      <Button
        type="button"
        disabled={friendState.disabled}
        aria-live="polite"
        aria-label={`friend status: ${friendState.label}`}
        data-testid="profile-action-friend"
        onClick={() => {}}
      >
        {friendState.label}
      </Button>
    </section>
  );
}
