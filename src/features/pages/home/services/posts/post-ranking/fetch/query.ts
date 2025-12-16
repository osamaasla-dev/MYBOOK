import { prisma } from "@/lib/prisma";
import type { PostVisibilityPreference, Visibility } from "@prisma/client";

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
};

export async function queryRecentPosts(params: {
  authorIds: string[];
  since: Date;
  limit: number;
}): Promise<RawFetchedPost[]> {
  const { authorIds, since, limit } = params;

  if (!authorIds.length) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: authorIds },
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
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });

  return posts;
}
