"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFollowRequestHandlers } from "../hooks/ui/useFollowActionHandlers";

export type FollowRequestActionsProps = {
  username: string;
  layout?: "row" | "column";
  className?: string;
  testId?: string;
};

export function FollowRequestActions({
  username,
  layout = "row",
  className,
  testId = "follow-request-actions",
}: FollowRequestActionsProps) {
  // Handle follow request actions and loading states
  const {
    handleAccept,
    handleReject,
    acceptDisabled,
    rejectDisabled,
    acceptIsPending,
    rejectIsPending,
  } = useFollowRequestHandlers(username);

  return (
    <div
      className={cn(
        "gap-2 justify-center",
        layout === "column" ? "flex flex-col" : "flex",
        className
      )}
      role="group"
      aria-label="Follow request actions"
      data-testid={testId}
    >
      <Button
        type="button"
        size="sm"
        variant="accept"
        disabled={acceptDisabled}
        onClick={handleAccept}
        aria-label={`Accept follow request from ${username}`}
        data-testid={`${testId}-accept`}
      >
        {acceptIsPending ? "accepting…" : "accept"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="reject"
        disabled={rejectDisabled}
        onClick={handleReject}
        aria-label={`Reject follow request from ${username}`}
        data-testid={`${testId}-reject`}
      >
        {rejectIsPending ? "rejecting…" : "reject"}
      </Button>
    </div>
  );
}
