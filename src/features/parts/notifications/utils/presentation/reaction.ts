import type { Builder } from "./types";
import { PostReactionType } from "@/features/parts/post/constants/reactions";

type PostReactionMetadata = {
  kind: "post_reaction";
  status?: "active" | "canceled";
  reaction: PostReactionType;
  reactorName?: string | null;
  reactorUsername?: string | null;
};

type CommentReactionMetadata = {
  kind: "comment_reaction";
  status?: "active" | "canceled";
  reaction: PostReactionType;
  actorName?: string | null;
  actorUsername?: string | null;
};

type ReactionNotificationMetadata =
  | PostReactionMetadata
  | CommentReactionMetadata;

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
  const isCommentReaction = metadata?.kind === "comment_reaction";
  const actorName =
    isCommentReaction && metadata?.kind === "comment_reaction"
      ? (metadata as CommentReactionMetadata)?.actorName
      : (metadata as PostReactionMetadata)?.reactorName;

  const actorUsername =
    isCommentReaction && metadata?.kind === "comment_reaction"
      ? (metadata as CommentReactionMetadata)?.actorUsername
      : (metadata as PostReactionMetadata)?.reactorUsername;

  const name =
    actorName ??
    notification.actor?.name ??
    notification.actor?.username ??
    actorUsername ??
    "Someone";

  const subtitle = isCommentReaction
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
