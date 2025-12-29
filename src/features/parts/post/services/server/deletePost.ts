"use server";

import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { Logger } from "pino";

type DeletePostInput = {
  postId: string;
  userId: string;
  log: Logger;
  requestId: string;
};

export async function deletePost({
  postId,
  userId,
  log,
  requestId,
}: DeletePostInput) {
  try {
    // Check if post exists and user is the owner
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        isDeleted: false,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      log.warn(postMessages.notFound);
      return {
        error: apiResponse(false, null, postMessages.notFound, 404, requestId),
      };
    }

    if (post.authorId !== userId) {
      log.warn(postMessages.delete.notAuthorized);
      return {
        error: apiResponse(
          false,
          null,
          postMessages.delete.notAuthorized,
          403,
          requestId
        ),
      };
    }

    // Soft delete the post
    await prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Optionally: Soft delete related content
    await Promise.allSettled([
      // Soft delete comments
      prisma.comment.updateMany({
        where: { postId, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      // Soft delete reactions
      prisma.postReaction.updateMany({
        where: { postId, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
    ]);
  } catch (error) {
    log.error({ error }, postMessages.delete.failed);
    return {
      error: apiResponse(
        false,
        null,
        postMessages.delete.failed,
        500,
        requestId
      ),
    };
  }
}
