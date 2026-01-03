import { useMemo } from "react";
import { getNotificationPresentation } from "@/features/parts/notifications/utils/presentation";
import type { NotificationListItem } from "@/features/parts/notifications/types";
import type { NotificationData } from "../types";

export function useNotificationData(
  notification: NotificationListItem
): NotificationData {
  return useMemo(() => {
    const presentation = getNotificationPresentation(notification);
    const fallbackUsername = notification.actor?.username ?? "";
    const fallbackName =
      notification.actor?.name ?? (fallbackUsername || "user");

    const profileHref =
      presentation?.profileHref ??
      (fallbackUsername
        ? `/user/profile/${encodeURIComponent(fallbackUsername)}`
        : "#");

    const title = presentation?.title ?? fallbackName;
    const subtitle = presentation?.subtitle ?? "sent you a notification";
    const initials =
      presentation?.initials ??
      fallbackUsername?.charAt(0).toUpperCase() ??
      "؟";
    const statusLabel = presentation?.statusLabel;
    const statusTone = presentation?.statusTone;
    const action = presentation?.action;
    const postId = presentation?.postId ?? notification.related.postId ?? null;

    return {
      presentation,
      fallbackUsername,
      fallbackName,
      profileHref,
      title,
      subtitle,
      initials,
      statusLabel,
      statusTone,
      action,
      postId,
    };
  }, [notification]);
}
