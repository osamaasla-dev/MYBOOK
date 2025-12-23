import { prisma } from "@/lib/prisma";

import { commentMessages } from "@/lib/messages";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";

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
