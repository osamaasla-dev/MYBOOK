import { postMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { mapUploadMediaToCreateInput } from "../../utils";
import type { CreatePostInput } from "../../schemas";
import { Logger } from "pino";
import { apiResponse } from "@/lib/apiResponse";
import { deletePostMediaAssets } from "./mediaCleanup";

type UpdatePostParams = {
  postId: string;
  authorId: string;
  input: CreatePostInput;
  log: Logger;
  requestId: string;
};

export async function updatePost({
  postId,
  authorId,
  input,
  log,
  requestId,
}: UpdatePostParams) {
  const {
    content = null,
    visibility,
    visibilityPreference,
    media: incomingMedia = [],
  } = input;

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
    log.warn({ postId }, postMessages.notFound);
    return {
      error: apiResponse(false, null, postMessages.notFound, 404, requestId),
    };
  }

  if (post.authorId !== authorId) {
    log.warn(
      { postId, authorId, postAuthorId: post.authorId },
      postMessages.update.notAuthorized
    );
    return {
      error: apiResponse(
        false,
        null,
        postMessages.update.notAuthorized,
        403,
        requestId
      ),
    };
  }

  const currentMedia = await prisma.media.findMany({
    where: { postId, isDeleted: false },
    select: {
      id: true,
      publicId: true,
      type: true,
    },
  });

  const incomingExistingIds = new Set(
    incomingMedia.filter((item) => item.id).map((item) => item.id as string)
  );

  const mediaToSoftDelete = currentMedia.filter(
    (mediaItem) => !incomingExistingIds.has(mediaItem.id)
  );

  const newMediaInputs = incomingMedia.filter((item) => !item.id);
  const mediaCreate = newMediaInputs.length
    ? mapUploadMediaToCreateInput(newMediaInputs)
    : null;

  const updatedPost = await prisma.$transaction(async (tx) => {
    if (mediaToSoftDelete.length) {
      await tx.media.updateMany({
        where: {
          id: {
            in: mediaToSoftDelete.map((item) => item.id),
          },
        },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }

    const postUpdate = await tx.post.update({
      where: { id: postId },
      data: {
        content,
        visibility,
        visibilityPreference,
        media: mediaCreate ? { create: mediaCreate } : undefined,
        updatedAt: new Date(),
      },
      include: {
        media: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    return postUpdate;
  });

  if (mediaToSoftDelete.length) {
    await deletePostMediaAssets(mediaToSoftDelete, log, {
      postId,
      reason: "update",
    });
  }

  return updatedPost;
}
