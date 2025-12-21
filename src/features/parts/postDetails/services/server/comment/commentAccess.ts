import { prisma } from "@/lib/prisma";

import { commentMessages } from "@/lib/messages";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";

export type CommentFetchAccessInput = {
  postId: string;
  parentId: string | null;
  viewerId: string | null;
};

export type CommentFetchAccessResult = {
  postAuthorId: string;
};

export async function ensureCommentFetchAccess({
  postId,
  parentId,
  viewerId,
}: CommentFetchAccessInput): Promise<CommentFetchAccessResult> {
  const [post, parentComment] = await Promise.all([
    prisma.post.findFirst({
      where: { id: postId, isDeleted: false },
      select: { id: true, authorId: true },
    }),
    parentId
      ? prisma.comment.findFirst({
          where: { id: parentId },
          select: { id: true, postId: true, isDeleted: true },
        })
      : null,
  ]);

  if (!post) {
    throw new CommentRouteError(commentMessages.postNotFound, 404);
  }

  if (parentId) {
    const parentMatchesPost =
      parentComment &&
      !parentComment.isDeleted &&
      parentComment.postId === postId;
    if (!parentMatchesPost) {
      throw new CommentRouteError(commentMessages.parentNotFound, 404);
    }
  }

  if (viewerId) {
    const blockExists = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: viewerId },
        ],
      },
      select: { id: true },
    });

    if (blockExists) {
      throw new CommentRouteError(commentMessages.blocked, 403);
    }
  }

  return {
    postAuthorId: post.authorId,
  };
}

export type CommentDeleteAccessInput = {
  commentId: string;
  postId: string;
  actorId: string;
};

export type CommentDeleteAccessResult = {
  comment: {
    id: string;
    authorId: string;
    parentId: string | null;
  };
  post: {
    id: string;
    authorId: string;
  };
};

export async function ensureCommentDeleteAccess({
  commentId,
  postId,
  actorId,
}: CommentDeleteAccessInput): Promise<CommentDeleteAccessResult> {
  const record = await prisma.comment.findFirst({
    where: { id: commentId, postId },
    select: {
      id: true,
      authorId: true,
      parentId: true,
      isDeleted: true,
      post: {
        select: {
          id: true,
          authorId: true,
        },
      },
    },
  });

  if (!record || !record.post || record.isDeleted) {
    throw new CommentRouteError(commentMessages.commentNotFound, 404);
  }

  const isAuthor = record.authorId === actorId;
  const isPostOwner = record.post.authorId === actorId;

  if (!isAuthor && !isPostOwner) {
    throw new CommentRouteError(commentMessages.forbidden, 403);
  }

  return {
    comment: {
      id: record.id,
      authorId: record.authorId,
      parentId: record.parentId,
    },
    post: {
      id: record.post.id,
      authorId: record.post.authorId,
    },
  };
}
