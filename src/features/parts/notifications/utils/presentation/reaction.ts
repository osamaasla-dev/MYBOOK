import type { Builder } from "./types";
import { PostReactionType } from "@/features/parts/post/constants/reactions";

type ReactionNotificationMetadata = {
  kind: "post_reaction" | "comment_reaction" | "reply_reaction";
  status?: "active" | "canceled";
  reaction: PostReactionType;
  actorName?: string | null;
  actorUsername?: string | null;
};

function buildTitle(
  primaryName: string,
  othersCount: number | undefined
): string {
  if (!othersCount || othersCount <= 0) {
    return primaryName;
  }

  return `${primaryName} and ${othersCount} other${othersCount > 1 ? "s" : ""}`;
}

export const reactionPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as ReactionNotificationMetadata | null;
  const actorName = metadata?.actorName;

  const actorUsername = metadata?.actorName;

  const name =
    actorName ??
    notification.actor?.name ??
    notification.actor?.username ??
    actorUsername ??
    "Someone";

  const isCommentReaction = metadata?.kind === "comment_reaction";
  const isReply = metadata?.kind === "reply_reaction";

  const subtitle = isReply
    ? "reacted to your reply"
    : isCommentReaction
    ? "reacted to your comment"
    : "reacted to your post";
  const title = buildTitle(name, notification.grouping?.othersCount);

  return {
    title,
    subtitle,
    postId: notification.related?.postId ?? null,
    commentId: notification.related?.commentId ?? null,
  };
};
