import type { Builder } from "./types";

type CommentNotificationMetadata = {
  kind: "post_comment" | "reply_comment";
  actorName?: string | null;
  actorUsername?: string | null;
  parentId: string | null;
};

export const commentPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as CommentNotificationMetadata | null;

  const actorName =
    metadata?.actorName ??
    notification.actor?.name ??
    notification.actor?.username ??
    "Someone";

  const isReply =
    notification.type === "REPLY" || metadata?.kind === "reply_comment";
  const subtitle = isReply
    ? "replied on your comment"
    : "commented on your post";

  return {
    title: actorName,
    subtitle,
  };
};
