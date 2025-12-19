import { prisma } from "@/lib/prisma";

export type CreateCommentParams = {
  authorId: string;
  postId: string;
  content: string;
  parentId?: string | null;
};

export async function createComment({
  authorId,
  postId,
  content,
  parentId = null,
}: CreateCommentParams) {
  const comment = await prisma.comment.create({
    data: {
      authorId,
      postId,
      content,
      parentId,
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

  await prisma.post.update({
    where: { id: postId },
    data: {
      commentsCount: {
        increment: 1,
      },
    },
  });

  if (parentId) {
    await prisma.comment.update({
      where: { id: parentId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });
  }

  return comment;
}

export type CommentWithAuthor = Awaited<ReturnType<typeof createComment>>;
