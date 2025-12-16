import { prisma } from "@/lib/prisma";
import { buildViewerRelationshipMap } from "@/features/pages/home/services/posts/post-ranking/relationships";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import {
  createFeedRelationshipSnapshot,
  type FeedPost,
} from "@/features/pages/home/utils/posts/feed-response";

type FetchFeedPostsParams = {
  viewerId: string;
  postIds: string[];
};

export async function fetchFeedPostsForViewer({
  viewerId,
  postIds,
}: FetchFeedPostsParams): Promise<FeedPost[]> {
  if (!viewerId || !postIds.length) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: {
      id: { in: postIds },
      isDeleted: false,
    },
    select: {
      id: true,
      authorId: true,
      content: true,
      richContent: true,
      linkPreview: true,
      publishedAt: true,
      reactionsCount: true,
      commentsCount: true,
      sharesCount: true,
      viewCount: true,
      reactionSummary: true,
      reactions: {
        where: { userId: viewerId },
        select: { emoji: true },
        take: 1,
      },
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          isVerified: true,
          isPrivate: true,
        },
      },
      media: {
        select: {
          id: true,
          url: true,
          type: true,
          width: true,
          height: true,
          duration: true,
        },
      },
    },
  });

  if (!posts.length) {
    return [];
  }

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const authorIds = Array.from(new Set(posts.map((post) => post.authorId)));
  const relations = await buildViewerRelationshipMap(viewerId, authorIds);

  return postIds
    .map((postId) => {
      const post = postsById.get(postId);
      if (!post) return null;

      const relationship =
        relations.get(post.authorId) ??
        createFeedRelationshipSnapshot(viewerId, post.authorId);

      const viewerReaction =
        (post.reactions[0]?.emoji as PostReactionType | undefined) ?? null;

      const feedPost: FeedPost = {
        postId: post.id,
        author: {
          id: post.author.id,
          name: post.author.name ?? post.author.username ?? "User",
          username: post.author.username ?? undefined,
          avatarUrl: post.author.avatarUrl ?? undefined,
          isVerified: post.author.isVerified,
          isPrivate: post.author.isPrivate,
          isFollowing: relationship.isFollower,
          isFriend: relationship.isFriend,
          isSelf: relationship.isSelf,
        },
        publishedAt: post.publishedAt,
        content: {
          text: post.content ?? null,
          richText: post.richContent ?? null,
          media: post.media.map((item) => ({
            id: item.id,
            url: item.url,
            type: item.type,
          })),
          linkPreview: post.linkPreview ?? null,
        },
        reactionsCount: post.reactionsCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewCount: post.viewCount,
        interactions: {
          hasLiked: Boolean(viewerReaction),
          hasCommented: false,
          hasShared: false,
          viewerReaction,
        },
        reactionSummary:
          (post.reactionSummary as Record<string, number> | null) ?? undefined,
      };

      return feedPost;
    })
    .filter((post): post is FeedPost => post !== null);
}
