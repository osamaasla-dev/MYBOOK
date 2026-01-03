import { prisma } from "@/lib/prisma";
import { PostVisibilityPreference, Visibility } from "@prisma/client";

import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";
import { buildFeedVisibilityFilters } from "./visibility";

export type RawFetchedPost = {
  id: string;
  authorId: string;
  publishedAt: Date;
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  authorDefaultVisibility: Visibility;
};

type QueryRecentPostsParams = {
  authorIds: string[];
  since: Date;
  limit: number;
  viewerId: string;
  relations: Map<string, ViewerRelationshipSnapshot>;
};

export async function queryRecentPosts(
  params: QueryRecentPostsParams
): Promise<RawFetchedPost[]> {
  const { authorIds, since, limit, viewerId, relations } = params;

  if (!authorIds.length) {
    return [];
  }

  const visibilityFilters = buildFeedVisibilityFilters({
    viewerId,
    authorIds,
    relations,
  });

  if (!visibilityFilters.length) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: {
      OR: visibilityFilters,
      publishedAt: { gte: since },
      isDeleted: false,
    },
    select: {
      id: true,
      authorId: true,
      publishedAt: true,
      reactionsCount: true,
      commentsCount: true,
      sharesCount: true,
      viewCount: true,

      visibility: true,
      visibilityPreference: true,
      author: {
        select: {
          privacySetting: {
            select: { postsVisibility: true },
          },
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });

  return posts.map((post) => ({
    id: post.id,
    authorId: post.authorId,
    publishedAt: post.publishedAt,
    reactionsCount: post.reactionsCount,
    commentsCount: post.commentsCount,
    sharesCount: post.sharesCount,
    viewCount: post.viewCount,
    visibility: post.visibility,
    visibilityPreference: post.visibilityPreference,
    authorDefaultVisibility:
      post.author?.privacySetting?.postsVisibility ?? Visibility.PUBLIC,
  }));
}
