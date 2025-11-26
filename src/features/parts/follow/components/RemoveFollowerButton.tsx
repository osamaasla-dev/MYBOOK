"use client";

import { Button } from "@/components/ui";
import { useRemoveFollower } from "../hooks";

export type RemoveFollowerButtonProps = {
  username: string;
};

export function RemoveFollowerButton({ username }: RemoveFollowerButtonProps) {
  const removeFollowerMutation = useRemoveFollower();

  return (
    <Button
      type="button"
      variant="reject"
      size="sm"
      disabled={removeFollowerMutation.isPending}
      aria-busy={removeFollowerMutation.isPending}
      onClick={() => removeFollowerMutation.mutate({ username })}
    >
      Remove Follower
    </Button>
  );
}
