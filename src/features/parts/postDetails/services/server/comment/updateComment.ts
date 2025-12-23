import { prisma } from "@/lib/prisma";

export type UpdateCommentParams = {
  commentId: string;
  content: string;
};

export async function updateComment({
  commentId,
  content,
}: UpdateCommentParams) {
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
