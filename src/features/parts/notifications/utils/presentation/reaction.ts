import type { Builder } from "./types";
import { PostReactionType } from "@/features/parts/post/constants/reactions";

type ReactionNotificationMetadata = {
  kind: "post_reaction";
  status?: "active" | "canceled";
  reaction: PostReactionType;
  reactorName?: string | null;
  reactorUsername?: string | null;
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
  const name =
    metadata?.reactorName ??
    notification.actor?.name ??
    (notification.actor?.username || "Someone");

  const subtitle = "reacted to your post";
  const title = buildTitle(name, notification.grouping?.othersCount);

  return {
    title,
    subtitle,
    postId: notification.related?.postId ?? null,
  };
};
