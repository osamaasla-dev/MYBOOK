import { prisma } from "@/lib/prisma";
import type {
  MediaType,
  PostVisibilityPreference,
  Visibility,
} from "@prisma/client";

export type RawFetchedPost = {
  id: string;
  authorId: string;
  publishedAt: Date;
  content: string | null;
  richContent: unknown | null;
  linkPreview: unknown | null;
  media: {
    id: string;
    url: string;
    type: MediaType;
    width: number | null;
    height: number | null;
    duration: number | null;
  }[];
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    isPrivate: boolean;
  };
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

  return prisma.post.findMany({
    where: {
      authorId: { in: authorIds },
      publishedAt: { gte: since },
      isDeleted: false,
    },
    select: {
      id: true,
      authorId: true,
      publishedAt: true,
      content: true,
      richContent: true,
      linkPreview: true,
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
      reactionsCount: true,
      commentsCount: true,
      sharesCount: true,
      viewCount: true,
      visibility: true,
      visibilityPreference: true,
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
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit,
  });
}
