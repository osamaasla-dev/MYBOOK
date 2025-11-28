"use client";

import { useMutationState } from "@tanstack/react-query";

import { Button } from "@/components/ui";
import { useRemoveFollower } from "../hooks";
import type { FollowActionInput } from "../types";
import { REMOVE_FOLLOWER_MUTATION_KEY } from "../hooks";

export type RemoveFollowerButtonProps = {
  username: string;
};

export function RemoveFollowerButton({ username }: RemoveFollowerButtonProps) {
  const removeFollowerMutation = useRemoveFollower();
  const sharedPending = useMutationState({
    filters: {
      mutationKey: REMOVE_FOLLOWER_MUTATION_KEY,
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });

  const isPending =
    removeFollowerMutation.isPending || sharedPending.length > 0;

  return (
    <Button
      type="button"
      variant="reject"
      size="sm"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => {
        if (isPending) {
          return;
        }
        removeFollowerMutation.mutate({ username });
      }}
    >
      Remove Follower
    </Button>
  );
}
