"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useFriendActionState } from "../hooks/ui/useFriendActionState";
import { useFriendActionHandlers } from "../hooks/ui/useFriendActionHandlers";
import { useFriendRealtime } from "../hooks";

export type FriendAddButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: ProfileRouteData["profile"]["username"];
  isBlocked: boolean;
  testId?: string;
};

export function FriendAddButton({
  viewer,
  profileUsername,
  isBlocked,
  testId = "friend-add-button",
}: FriendAddButtonProps) {
  // Realtime updates
  useFriendRealtime(profileUsername);

  // Determine button state
  const actionState = useFriendActionState(viewer, isBlocked);

  // Handle button actions and loading states
  const { handleClick, sendIsPending, cancelIsPending } =
    useFriendActionHandlers(viewer, profileUsername, actionState, isBlocked);

  // Don't render for self profile
  if (viewer.isSelf) {
    return null;
  }

  // Calculate disabled state
  const isDisabled =
    actionState.disabled ||
    viewer.isSelf ||
    isBlocked ||
    sendIsPending ||
    cancelIsPending;

  // Show loading state for button text
  const buttonLabel =
    actionState.label === "cancel request" && cancelIsPending
      ? "cancelling…"
      : actionState.label === "add friend" && sendIsPending
      ? "adding…"
      : actionState.label;

  return (
    <Button
      type="button"
      disabled={isDisabled}
      aria-live="polite"
      aria-label={`Friend status: ${buttonLabel} for ${profileUsername}`}
      data-testid={testId}
      onClick={handleClick}
    >
      {buttonLabel}
    </Button>
  );
}
