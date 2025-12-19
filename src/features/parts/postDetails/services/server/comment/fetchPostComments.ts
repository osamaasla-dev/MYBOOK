import { prisma } from "@/lib/prisma";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "@/features/parts/postDetails/constants";

type CommentAuthorSummary = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type PostCommentListItem = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  content: string;
  reactionSummary: ReactionSummary | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthorSummary;
};

export type FetchPostCommentsInput = {
  postId: string;
  parentId?: string | null;
  cursor?: string | null;
  limit?: number;
};

export type FetchPostCommentsResult = {
  comments: PostCommentListItem[];
  nextCursor: string | null;
};

export async function fetchPostComments({
  postId,
  parentId = null,
  cursor = null,
  limit = DEFAULT_LIMIT,
}: FetchPostCommentsInput): Promise<FetchPostCommentsResult> {
  const take = Math.min(Math.max(limit, 1), MAX_LIMIT);

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: parentId ?? null,
      isDeleted: false,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: take + 1,
    select: {
      id: true,
      postId: true,
      parentId: true,
      authorId: true,
      content: true,
      reactionSummary: true,
      replyCount: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  let nextCursor: string | null = null;
  if (comments.length > take) {
    const nextItem = comments.pop();
    nextCursor = nextItem?.id ?? null;
  }

  const items: PostCommentListItem[] = comments.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    content: comment.content,
    reactionSummary:
      (comment.reactionSummary as ReactionSummary | null) ?? null,
    replyCount: comment.replyCount,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name,
      username: comment.author.username,
      avatarUrl: comment.author.avatarUrl,
    },
  }));

  return {
    comments: items,
    nextCursor,
  };
}
