import { RankedPost } from "@/features/pages/home/utils/posts/post-ranking";
import { PostCardProps } from "./types";

export function buildPostCardPropsFromRankedPost(
  post: RankedPost
): PostCardProps {
  const usernameLabel = post.author.username
    ? `@${post.author.username}`
    : undefined;

  const secondaryLabel = post.viewerRelationship.isFriend
    ? "Friend"
    : usernameLabel;

  return {
    author: {
      name: post.author.name ?? post.author.username ?? "User",
      username: post.author.username ?? undefined,
      avatarUrl: post.author.avatarUrl ?? undefined,
      secondaryLabel,
      isFollowing: post.viewerRelationship.isFollower,
    },
    timestamp: post.publishedAt,
    content: {
      text: post.content.text ?? "This post has no text.",
      media:
        post.content.media?.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
        })) ?? [],
    },
    stats: {
      reactions: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
    },
  };
}
