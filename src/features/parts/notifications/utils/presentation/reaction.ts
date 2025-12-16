import type { Builder } from "./types";
import {
  PostReactionType,
  reactionTypeToEmoji,
} from "@/features/parts/post/constants/reactions";
type ReactionNotificationMetadata = {
  kind: "post_reaction";
  status?: "active" | "canceled";
  reaction: PostReactionType;
  reactorName?: string | null;
  reactorUsername?: string | null;
};

function buildSubtitle(metadata: ReactionNotificationMetadata | null) {
  if (!metadata) return "reacted to your post";
  const emoji = reactionTypeToEmoji(metadata?.reaction ?? null);

  if (metadata.reaction) {
    return ` ${emoji} your post `;
  }

  return "reacted to your post";
}

export const reactionPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as ReactionNotificationMetadata | null;
  const name =
    metadata?.reactorName ??
    notification.actor?.name ??
    (notification.actor?.username || "Someone");

  const subtitle = buildSubtitle(metadata);

  return {
    title: name,
    subtitle,
    postId: notification.related?.postId ?? null,
  };
};
