"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "../types";
import { FollowButton } from "@/features/parts/follow/components/FollowButton";

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
  const friendState = getFriendState(viewer, isBlocked);

  if (viewer.isSelf) {
    return null;
  }
  return (
    <section
      className="flex flex-wrap gap-3"
      aria-label="Profile actions"
      data-testid="profile-actions"
    >
      <FollowButton
        viewer={viewer}
        profileUsername={profileUsername}
        isBlocked={isBlocked}
      />
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
