"use client";

import type { ProfileRouteData } from "../types";
import { FollowButton } from "@/features/parts/follow/components/FollowButton";
import { FriendActionButton } from "@/features/parts/addFriend/components/FriendActionButton";
import { BlockButton } from "@/features/parts/block/components/BlockButton";

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

  if (viewer.isSelf) {
    return null;
  }
  return (
    <section
      className="flex flex-wrap gap-3 px-5"
      aria-label="Profile actions"
      data-testid="profile-actions"
    >
      <FollowButton
        viewer={viewer}
        profileUsername={profileUsername}
        isBlocked={isBlocked}
      />
      <FriendActionButton
        viewer={viewer}
        profileUsername={profileUsername}
        isBlocked={isBlocked}
      />
      <BlockButton viewer={viewer} profileUsername={profileUsername} />
    </section>
  );
}
