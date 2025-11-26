"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAcceptFollowRequest, useRejectFollowRequest } from "../hooks";

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

  const isPending = acceptMutation.isPending || rejectMutation.isPending;

  const handleAccept = () => {
    if (!isPending) {
      acceptMutation.mutate({ username });
    }
  };

  const handleReject = () => {
    if (!isPending) {
      rejectMutation.mutate({ username });
    }
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
        disabled={isPending}
        onClick={handleAccept}
      >
        {acceptMutation.isPending ? "Accepting…" : "Accept"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="reject"
        disabled={isPending}
        onClick={handleReject}
      >
        {rejectMutation.isPending ? "Rejecting…" : "Reject"}
      </Button>
    </div>
  );
}
