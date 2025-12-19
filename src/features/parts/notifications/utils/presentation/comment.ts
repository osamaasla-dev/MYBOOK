import type { Builder } from "./types";

type CommentNotificationMetadata = {
  kind: "post_comment";
  actorName?: string | null;
  actorUsername?: string | null;
};

export const commentPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as CommentNotificationMetadata | null;

  const actorName =
    metadata?.actorName ??
    notification.actor?.name ??
    notification.actor?.username ??
    "Someone";

  const subtitle = "commented on your post";

  return {
    title: actorName,
    subtitle,
  };
};
