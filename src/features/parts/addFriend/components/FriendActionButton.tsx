"use client";

import type { ProfileRouteData } from "@/features/pages/profile/types";
import { FriendAddButton } from "./FriendAddButton";
import { FriendUnfriendButton } from "./FriendUnfriendButton";
import { AcceptRejectFriendButtons } from "./AcceptRejectFriendButtons";

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
  const testId = "friend-action-button";
  // Don't render for self profile
  if (viewer.isSelf) {
    return null;
  }

  // If user is already a friend, show unfriend button
  if (viewer.isFriend) {
    return (
      <FriendUnfriendButton
        viewer={viewer}
        profileUsername={profileUsername}
        isBlocked={isBlocked}
        testId={`${testId}-unfriend`}
      />
    );
  }

  // If user has incoming friend request, show accept/reject buttons
  if (viewer.hasIncomingFriendRequest) {
    return (
      <AcceptRejectFriendButtons
        profileUsername={profileUsername}
        isBlocked={isBlocked}
        testId={`${testId}-accept-reject`}
      />
    );
  }

  // Otherwise, show add/cancel friend button
  return (
    <FriendAddButton
      viewer={viewer}
      profileUsername={profileUsername}
      isBlocked={isBlocked}
      testId={`${testId}-add`}
    />
  );
}
