"use client";

import { Button } from "@/components/ui";
import { useRemoveFollowerHandler } from "../hooks/ui/useFollowActionHandlers";

export type RemoveFollowerButtonProps = {
  username: string;
  testId?: string;
};

export function RemoveFollowerButton({
  username,
  testId = "remove-follower-button",
}: RemoveFollowerButtonProps) {
  // Handle remove follower action and loading state
  const { handleRemoveFollower, isPending } =
    useRemoveFollowerHandler(username);

  return (
    <Button
      type="button"
      variant="reject"
      size="sm"
      disabled={isPending}
      aria-busy={isPending}
      aria-label={`Remove follower ${username}`}
      data-testid={testId}
      onClick={handleRemoveFollower}
    >
      {isPending ? "removing…" : "Remove Follower"}
    </Button>
  );
}
