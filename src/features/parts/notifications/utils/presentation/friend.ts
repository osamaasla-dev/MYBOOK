import type { FriendNotificationMetadata } from "@/features/parts/addFriend/types";

import type { Builder, NotificationPresentation } from "./types";

export const friendPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as FriendNotificationMetadata | null;
  const username =
    metadata?.requesterUsername ?? notification.actor?.username ?? "";
  const name = metadata?.requesterName ?? notification.actor?.name ?? username;
  const initials = username?.charAt(0).toUpperCase() || "؟";

  const subtitle = (() => {
    switch (metadata?.kind) {
      case "friend-request":
        return "sent you a friend request";
      case "friend-request-accepted":
        return "accepted your friend request";
      case "friend-request-rejected":
        return "rejected your friend request";
      case "friend-request-canceled":
        return "canceled the friend request";
      default:
        return "updated friend request";
    }
  })();

  let statusTone: NotificationPresentation["statusTone"];
  if (metadata?.status === "pending") statusTone = "primary";
  if (metadata?.status === "accepted") statusTone = "success";
  if (metadata?.status === "rejected" || metadata?.status === "canceled") {
    statusTone = "danger";
  }

  return {
    profileHref: username
      ? `/user/profile/${encodeURIComponent(username)}`
      : "#",
    title: name || "user",
    subtitle,
    initials,
    statusLabel: metadata?.status,
    statusTone,
    action:
      metadata?.kind === "friend-request" && metadata.status === "pending"
        ? {
            kind: "friend-request",
            username,
          }
        : undefined,
  };
};
