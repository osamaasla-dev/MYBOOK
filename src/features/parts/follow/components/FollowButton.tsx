"use client";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useFollowRealtime } from "../hooks";
import { useFollowActionState } from "../hooks/ui/useFollowActionState";
import { useFollowActionHandlers } from "../hooks/ui/useFollowActionHandlers";

export type FollowButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: string;
  isBlocked: boolean;
  testId?: string;
};

export function FollowButton({
  viewer,
  profileUsername,
  isBlocked,
  testId = "profile-action-follow",
}: FollowButtonProps) {
  // Realtime updates
  useFollowRealtime(profileUsername);

  // Determine follow action state
  const actionState = useFollowActionState(viewer, isBlocked);

  // Handle follow action logic and loading states
  const { handleFollowToggle, isDisabled } = useFollowActionHandlers(
    viewer,
    profileUsername,
    actionState
  );

  // Don't render for self profile
  if (viewer.isSelf) {
    return null;
  }

  // Get button label based on action state
  const buttonLabel = actionState.label;

  return (
    <Button
      type="button"
      disabled={isDisabled}
      aria-live="polite"
      aria-label={`follow status: ${buttonLabel}`}
      data-testid={testId}
      onClick={handleFollowToggle}
    >
      {buttonLabel}
    </Button>
  );
}
