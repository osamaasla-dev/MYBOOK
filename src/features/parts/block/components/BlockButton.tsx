"use client";

import { useMutationState } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ProfileRouteData } from "@/features/pages/profile/types";

import {
  BLOCK_MUTATION_KEY,
  UNBLOCK_MUTATION_KEY,
  useBlockUser,
  useUnblockUser,
} from "../hooks";

export type BlockButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: string;
  className?: string;
};

export function BlockButton({
  viewer,
  profileUsername,
  className,
}: BlockButtonProps) {
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const blockPending = useBlockActionPending(
    profileUsername,
    BLOCK_MUTATION_KEY
  );
  const unblockPending = useBlockActionPending(
    profileUsername,
    UNBLOCK_MUTATION_KEY
  );

  if (viewer.isSelf) {
    return null;
  }

  const isBlocked = viewer.isBlocked;
  const isBlocking = blockMutation.isPending || blockPending.length > 0;
  const isUnblocking = unblockMutation.isPending || unblockPending.length > 0;
  const isPending = isBlocked ? isUnblocking : isBlocking;
  const isDisabled = isPending;

  const handleConfirm = async () => {
    if (isDisabled) return;
    if (isBlocked) {
      unblockMutation.mutate({ username: profileUsername });
      return;
    }
    blockMutation.mutate({ username: profileUsername });
  };

  const dialogCopy = isBlocked
    ? {
        title: "Unblock this user?",
        description: "They will be able to interact with you again.",
        confirmLabel: "Unblock",
        confirmVariant: "default" as const,
        ariaLabel: "unblock user",
        buttonText: isPending ? "unblocking…" : "unblock",
      }
    : {
        title: "Block this user?",
        description:
          "They won't be able to interact with you or see your content.",
        confirmLabel: "Block",
        confirmVariant: "danger" as const,
        ariaLabel: "block user",
        buttonText: isPending ? "blocking…" : "block",
      };

  return (
    <ConfirmDialog
      title={dialogCopy.title}
      description={dialogCopy.description}
      confirmLabel={dialogCopy.confirmLabel}
      cancelLabel="Cancel"
      confirmVariant={dialogCopy.confirmVariant}
      isConfirming={isPending}
      onConfirm={handleConfirm}
      trigger={
        <Button
          type="button"
          disabled={isDisabled}
          aria-live="polite"
          aria-label={dialogCopy.ariaLabel}
          data-testid="profile-action-block"
          className={className}
        >
          {dialogCopy.buttonText}
        </Button>
      }
    />
  );
}

function useBlockActionPending(
  username: string,
  mutationKey: readonly unknown[]
) {
  return useMutationState({
    filters: {
      mutationKey,
      status: "pending",
      predicate: (mutation) => {
        const variables = mutation.state.variables as
          | { username: string }
          | undefined;
        return variables?.username === username;
      },
    },
  });
}
