"use client";

import { useMutationState } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAcceptFollowRequest, useRejectFollowRequest } from "../hooks";
import type { FollowActionInput } from "../types";

export type FollowRequestActionsProps = {
  username: string;
  layout?: "row" | "column";
  className?: string;
};

export function FollowRequestActions({
  username,
  layout = "row",
  className,
}: FollowRequestActionsProps) {
  const acceptMutation = useAcceptFollowRequest();
  const rejectMutation = useRejectFollowRequest();

  const sharedAcceptPending = useMutationState({
    filters: {
      mutationKey: ["follow-request", "accept"],
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });

  const sharedRejectPending = useMutationState({
    filters: {
      mutationKey: ["follow-request", "reject"],
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | FollowActionInput
          | undefined;
        return variables?.username === username;
      },
    },
  });

  const acceptIsPending =
    acceptMutation.isPending || sharedAcceptPending.length > 0;
  const rejectIsPending =
    rejectMutation.isPending || sharedRejectPending.length > 0;

  const acceptDisabled = acceptIsPending || rejectIsPending;
  const rejectDisabled = acceptIsPending || rejectIsPending;

  const handleAccept = () => {
    if (acceptDisabled) {
      return;
    }

    acceptMutation.mutate({ username });
  };

  const handleReject = () => {
    if (rejectDisabled) {
      return;
    }

    rejectMutation.mutate({ username });
  };

  return (
    <div
      className={cn(
        "gap-2 justify-center",
        layout === "column" ? "flex flex-col" : "flex",
        className
      )}
    >
      <Button
        type="button"
        size="sm"
        variant="accept"
        disabled={acceptDisabled}
        onClick={handleAccept}
      >
        {acceptIsPending ? "accepting…" : "accept"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="reject"
        disabled={rejectDisabled}
        onClick={handleReject}
      >
        {rejectIsPending ? "rejecting…" : "reject"}
      </Button>
    </div>
  );
}
