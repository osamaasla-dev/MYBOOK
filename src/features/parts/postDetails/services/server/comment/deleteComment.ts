import { prisma } from "@/lib/prisma";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";

export type DeleteCommentParams = {
  commentId: string;
  postId: string;
  parentId: string | null;
  postAuthorId: string;
  deletedById: string;
};

export type DeleteCommentResult = {
  id: string;
  postId: string;
  parentId: string | null;
  postAuthorId: string;
  deletedById: string;
  commentsCount: number;
  sharesCount: number;
  reactionSummary: ReactionSummary | null;
};

export async function deleteComment({
  commentId,
  postId,
  parentId,
  postAuthorId,
  deletedById,
}: DeleteCommentParams): Promise<DeleteCommentResult> {
  const deletedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    await tx.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt,
        deletedById,
      },
    });

    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          decrement: 1,
        },
      },
      select: {
        commentsCount: true,
        sharesCount: true,
        reactionSummary: true,
      },
    });

    if (parentId) {
      await tx.comment.update({
        where: { id: parentId },
        data: {
          replyCount: {
            decrement: 1,
          },
        },
      });
    }

    return {
      commentsCount: updatedPost.commentsCount,
      sharesCount: updatedPost.sharesCount,
      reactionSummary:
        (updatedPost.reactionSummary as ReactionSummary | null) ?? null,
    };
  });

  return {
    id: commentId,
    postId,
    parentId,
    postAuthorId,
    deletedById,
    commentsCount: Math.max(result.commentsCount, 0),
    sharesCount: result.sharesCount,
    reactionSummary: result.reactionSummary,
  };
}
