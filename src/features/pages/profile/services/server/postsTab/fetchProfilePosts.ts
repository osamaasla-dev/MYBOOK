import { prisma } from "@/lib/prisma";
import { ReactionState } from "@prisma/client";
import { buildWhereClause } from "./buildWhereClause";
import { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking";

export interface FetchProfilePostsOptions {
  relationship: ViewerRelationshipSnapshot;
  profileOwnerId: string;
  viewerId: string;
  cursor?: string;
  limit: number;
}

export async function fetchProfilePosts({
  relationship,
  profileOwnerId,
  viewerId,
  cursor,
  limit,
}: FetchProfilePostsOptions) {
  const whereClause = await buildWhereClause(profileOwnerId, relationship);

  const posts = await prisma.post.findMany({
    where: whereClause,
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
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          url: true,
          publicId: true,
          type: true,
          width: true,
          height: true,
          duration: true,
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit + 1, // Get one extra to check if there are more
    ...(cursor && { cursor: { id: cursor } }),
  });

  return posts;
}
