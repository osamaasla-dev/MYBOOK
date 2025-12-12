import { RankedPost } from "@/features/pages/home/utils/posts/post-ranking";
import { PostCardProps } from "./types";

export function buildPostCardPropsFromRankedPost(
  post: RankedPost
): PostCardProps {
  return {
    postId: post.postId,
    author: {
      name: post.author.name ?? post.author.username ?? "User",
      username: post.author.username ?? undefined,
      avatarUrl: post.author.avatarUrl ?? undefined,

      isFollowing: post.viewerRelationship.isFollower,
      isFriend: post.viewerRelationship.isFriend,
      isSelf: post.viewerRelationship.isSelf,
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
      viewerReaction: post.interactions.viewerReaction,
      reactionSummary: post.reactionSummary ?? undefined,
    },
  };
}
