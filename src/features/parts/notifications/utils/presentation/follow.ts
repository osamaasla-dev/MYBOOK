import type { FollowNotificationMetadata } from "@/features/parts/follow/types";

import type {
  Builder,
  NotificationAction,
  NotificationPresentation,
} from "./types";

export const followPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as FollowNotificationMetadata | null;
  const username =
    metadata?.followerUsername ?? notification.actor?.username ?? "";
  const name = metadata?.followerName ?? notification.actor?.name ?? username;
  const initials = username?.charAt(0).toUpperCase() || "؟";

  const subtitle = (() => {
    switch (metadata?.kind) {
      case "follow-request":
        return "requested to follow you";
      case "follow-request-approved":
        return "follow request approved";
      default:
        return "followed you";
    }
  })();

  let statusTone: NotificationPresentation["statusTone"];
  if (metadata?.status === "pending") statusTone = "primary";
  if (metadata?.status === "accepted") statusTone = "success";
  if (metadata?.status === "rejected") statusTone = "danger";

  const action: NotificationAction | undefined =
    metadata?.status === "pending" && username
      ? { kind: "follow-request", username }
      : undefined;

  return {
    profileHref: username
      ? `/user/profile/${encodeURIComponent(username)}`
      : "#",
    title: name || "user",
    subtitle,
    initials,
    statusLabel: metadata?.status,
    statusTone,
    action,
  };
};
