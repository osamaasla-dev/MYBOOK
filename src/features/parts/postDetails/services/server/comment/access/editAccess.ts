import { prisma } from "@/lib/prisma";

import { commentMessages } from "@/lib/messages";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";

export type CommentEditAccessInput = {
  commentId: string;
  postId: string;
  actorId: string;
};

export type CommentEditAccessResult = {
  comment: {
    id: string;
    authorId: string;
  };
  post: {
    id: string;
    authorId: string;
  };
};

export async function ensureCommentEditAccess({
  commentId,
  postId,
  actorId,
}: CommentEditAccessInput): Promise<CommentEditAccessResult> {
  const record = await prisma.comment.findFirst({
    where: { id: commentId, postId },
    select: {
      id: true,
      authorId: true,
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
  if (!isAuthor) {
    throw new CommentRouteError(commentMessages.forbidden, 403);
  }

  return {
    comment: {
      id: record.id,
      authorId: record.authorId,
    },
    post: {
      id: record.post.id,
      authorId: record.post.authorId,
    },
  };
}
