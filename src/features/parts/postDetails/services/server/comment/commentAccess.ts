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
