import { useCallback } from "react";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useBlockActionLoading } from "./useBlockActionLoading";
import type { BlockActionState } from "./useBlockActionState";

export function useBlockActionHandlers(
  viewer: ProfileRouteData["viewer"],
  profileUsername: string,
  actionState: BlockActionState
) {
  const { blockMutation, unblockMutation, isBlocking, isUnblocking } =
    useBlockActionLoading(profileUsername);

  const isPending = actionState.isBlocked ? isUnblocking : isBlocking;
  const isDisabled = isPending || actionState.disabled;

  const handleConfirm = useCallback(() => {
    if (isDisabled) return;

    if (actionState.isBlocked) {
      unblockMutation.mutate({ username: profileUsername });
      return;
    }

    blockMutation.mutate({ username: profileUsername });
  }, [
    isDisabled,
    actionState.isBlocked,
    blockMutation,
    unblockMutation,
    profileUsername,
  ]);

  return {
    handleConfirm,
    isPending,
    isDisabled,
  };
}
