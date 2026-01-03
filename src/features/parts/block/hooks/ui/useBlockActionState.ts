import { useMemo } from "react";
import type { ProfileRouteData } from "@/features/pages/profile/types";

export type BlockActionState = {
  isBlocked: boolean;
  action: "block" | "unblock";
  disabled: boolean;
};

export function useBlockActionState(
  viewer: ProfileRouteData["viewer"]
): BlockActionState {
  return useMemo(() => {
    if (viewer.isSelf) {
      return { isBlocked: false, action: "block", disabled: true };
    }

    return {
      isBlocked: viewer.isBlocked,
      action: viewer.isBlocked ? "unblock" : "block",
      disabled: false,
    };
  }, [viewer.isBlocked, viewer.isSelf]);
}
