import { prisma } from "@/lib/prisma";
import { commentMessages } from "@/lib/messages";
import { CommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import { isBlock } from "@/features/parts/block/utils/server";

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
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    throw new CommentRouteError(commentMessages.postNotFound, 404);
  }

  if (post.authorId) {
    const blockStatus = await isBlock(authorId, post.authorId);
    if (blockStatus.anyBlock) {
      throw new CommentRouteError(commentMessages.commentNotFound, 404);
    }
  }

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        postId: true,
        authorId: true,
      },
    });

    if (!parentComment || parentComment.postId !== postId) {
      throw new CommentRouteError(commentMessages.parentNotFound, 404);
    }

    if (parentComment.authorId) {
      const blockStatus = await isBlock(authorId, parentComment.authorId);
      if (blockStatus.anyBlock) {
        throw new CommentRouteError(commentMessages.commentNotFound, 404);
      }
    }
  }

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
