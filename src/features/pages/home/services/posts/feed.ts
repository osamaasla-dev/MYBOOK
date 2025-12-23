import { prisma } from "@/lib/prisma";
import { buildViewerRelationshipMap } from "@/features/pages/home/services/posts/post-ranking/relationships";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import {
  createFeedRelationshipSnapshot,
  type FeedPost,
} from "@/features/pages/home/utils/posts/feed-response";
import { buildFeedPost } from "@/features/parts/post/utils";
import { ReactionState } from "@prisma/client";

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
      visibility: true,
      visibilityPreference: true,
      reactions: {
        where: {
          userId: viewerId,
          state: { not: ReactionState.CANCEL }, // Exclude canceled reactions
        },
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

      const feedPost: FeedPost = buildFeedPost({
        post,
        relationship,
        viewerReaction,
      });

      return feedPost;
    })
    .filter((post): post is FeedPost => post !== null);
}
