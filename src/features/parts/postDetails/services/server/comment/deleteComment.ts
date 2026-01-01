import { prisma } from "@/lib/prisma";
import { commentMessages } from "@/lib/messages";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import { isBlock } from "@/features/parts/block/utils/server";

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
  const commentMeta = await prisma.comment.findUnique({
    where: { id: commentId, postId },
    select: { authorId: true, isDeleted: true },
  });

  if (!commentMeta || commentMeta.isDeleted) {
    throw new CommentRouteError(commentMessages.commentNotFound, 404);
  }

  if (postAuthorId) {
    const postBlock = await isBlock(deletedById, postAuthorId);
    if (postBlock.anyBlock) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }
  }

  if (commentMeta.authorId && commentMeta.authorId !== deletedById) {
    const commentBlock = await isBlock(deletedById, commentMeta.authorId);
    if (commentBlock.anyBlock) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }
  }

  const deletedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Get the comment to be deleted to count its replies
    const commentToDelete = await tx.comment.findUnique({
      where: { id: commentId },
      select: { replyCount: true },
    });

    const replyCount = commentToDelete?.replyCount ?? 0;
    const totalCommentsToDelete = 1 + replyCount; // comment itself + its replies

    // If the comment has replies, delete them first (cascade delete)
    if (replyCount > 0) {
      await tx.comment.updateMany({
        where: { parentId: commentId },
        data: {
          isDeleted: true,
          deletedAt,
          deletedById,
        },
      });
    }

    // Delete the main comment
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
          decrement: totalCommentsToDelete,
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
