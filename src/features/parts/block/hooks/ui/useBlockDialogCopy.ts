import { useMemo } from "react";
import type { BlockActionState } from "./useBlockActionState";

export type BlockDialogCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "default" | "danger";
  ariaLabel: string;
  buttonText: string;
};

export function useBlockDialogCopy(
  actionState: BlockActionState,
  isPending: boolean
): BlockDialogCopy {
  return useMemo(() => {
    if (actionState.isBlocked) {
      return {
        title: "Unblock this user?",
        description: "They will be able to interact with you again.",
        confirmLabel: "Unblock",
        confirmVariant: "default" as const,
        ariaLabel: "unblock user",
        buttonText: isPending ? "unblocking…" : "unblock",
      };
    }

    return {
      title: "Block this user?",
      description:
        "They won't be able to interact with you or see your content.",
      confirmLabel: "Block",
      confirmVariant: "danger" as const,
      ariaLabel: "block user",
      buttonText: isPending ? "blocking…" : "block",
    };
  }, [actionState.isBlocked, isPending]);
}
