"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ProfileRouteData } from "@/features/pages/profile/types";
import { useBlockActionState } from "../hooks/ui/useBlockActionState";
import { useBlockActionHandlers } from "../hooks/ui/useBlockActionHandlers";
import { useBlockDialogCopy } from "../hooks/ui/useBlockDialogCopy";

export type BlockButtonProps = {
  viewer: ProfileRouteData["viewer"];
  profileUsername: string;
  className?: string;
  testId?: string;
};

export function BlockButton({
  viewer,
  profileUsername,
  className,
  testId = "profile-action-block",
}: BlockButtonProps) {
  // Determine block action state
  const actionState = useBlockActionState(viewer);

  // Handle block action logic and loading states
  const { handleConfirm, isPending, isDisabled } = useBlockActionHandlers(
    viewer,
    profileUsername,
    actionState
  );

  // Get dialog copy based on state
  const dialogCopy = useBlockDialogCopy(actionState, isPending);

  // Don't render for self profile
  if (viewer.isSelf) {
    return null;
  }

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
          data-testid={testId}
          className={className}
        >
          {dialogCopy.buttonText}
        </Button>
      }
    />
  );
}
