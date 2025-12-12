import { prisma } from "@/lib/prisma";
import type {
  MediaType,
  PostVisibilityPreference,
  Visibility,
  Prisma,
} from "@prisma/client";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";

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
  reactionSummary: ReactionSummary | null;
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

type PrismaFetchedPost = Omit<RawFetchedPost, "reactionSummary"> & {
  reactionSummary: Prisma.JsonValue | null;
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

  const posts = (await prisma.post.findMany({
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
      reactionSummary: true,
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
  })) as PrismaFetchedPost[];

  return posts.map((post) => ({
    ...post,
    reactionSummary: normalizeReactionSummary(post.reactionSummary),
  }));
}

function normalizeReactionSummary(
  value: Prisma.JsonValue | null
): ReactionSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);
  for (const [, count] of entries) {
    if (typeof count !== "number") {
      return null;
    }
  }

  return value as ReactionSummary;
}
