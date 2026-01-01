import { prisma } from "@/lib/prisma";
import { commentMessages } from "@/lib/messages";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import { isBlock } from "@/features/parts/block/utils/server";

export type UpdateCommentParams = {
  commentId: string;
  content: string;
  actorId: string;
};

export async function updateComment({
  commentId,
  content,
  actorId,
}: UpdateCommentParams) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      post: {
        select: {
          authorId: true,
        },
      },
    },
  });

  if (!comment || !comment.post) {
    throw new CommentRouteError(commentMessages.commentNotFound, 404);
  }

  if (comment.post.authorId) {
    const blockStatus = await isBlock(actorId, comment.post.authorId);
    if (blockStatus.anyBlock) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }
  }

  if (comment.authorId && comment.authorId !== actorId) {
    const blockStatus = await isBlock(actorId, comment.authorId);
    if (blockStatus.anyBlock) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
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
}
