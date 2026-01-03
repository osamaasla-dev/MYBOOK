"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useFriendActionHandlers } from "../hooks/ui/useFriendActionHandlers";
import { useFriendRealtime } from "../hooks";

export type FriendUnfriendButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: ProfileRouteData["profile"]["username"];
  isBlocked: boolean;
  testId?: string;
};

export function FriendUnfriendButton({
  viewer,
  profileUsername,
  isBlocked,
  testId = "friend-unfriend-button",
}: FriendUnfriendButtonProps) {
  // Realtime updates
  useFriendRealtime(profileUsername);

  // Handle unfriend action and loading state
  const { handleUnfriendClick, unFriendIsPending, sendIsPending } =
    useFriendActionHandlers(
      viewer,
      profileUsername,
      { label: "unfriend", disabled: true, action: "unfriend" },
      isBlocked
    );

  // Don't render for self profile
  if (viewer.isSelf) {
    return null;
  }

  // Calculate disabled state
  const removeDisabled = isBlocked || unFriendIsPending || sendIsPending;

  return (
    <Button
      type="button"
      disabled={removeDisabled}
      aria-live="polite"
      aria-label={`Unfriend ${profileUsername}`}
      data-testid={testId}
      onClick={handleUnfriendClick}
    >
      {unFriendIsPending ? "removing…" : "unfriend"}
    </Button>
  );
}
