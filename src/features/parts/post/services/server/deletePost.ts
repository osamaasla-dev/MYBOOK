"use server";

import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { Logger } from "pino";
import { deletePostMediaAssets } from "./mediaCleanup";

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
        media: {
          where: { isDeleted: false },
          select: {
            id: true,
            publicId: true,
            type: true,
          },
        },
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

    const timestamp = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: {
          isDeleted: true,
          deletedAt: timestamp,
        },
      });

      await tx.media.updateMany({
        where: { postId, isDeleted: false },
        data: { isDeleted: true, deletedAt: timestamp },
      });

      await tx.comment.updateMany({
        where: { postId, isDeleted: false },
        data: { isDeleted: true, deletedAt: timestamp },
      });

      await tx.postReaction.updateMany({
        where: { postId, isDeleted: false },
        data: { isDeleted: true, deletedAt: timestamp },
      });
    });

    if (post.media.length) {
      await deletePostMediaAssets(post.media, log, {
        postId,
        reason: "delete",
      });
    }
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
