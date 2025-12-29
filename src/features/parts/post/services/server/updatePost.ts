import { postMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { mapUploadMediaToCreateInput } from "../../utils";
import type { CreatePostInput } from "../../schemas";
import { Logger } from "pino";
import { apiResponse } from "@/lib/apiResponse";

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
  const { content = null, visibility, visibilityPreference, media } = input;

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

  // Soft delete existing media before creating new media
  await prisma.media.updateMany({
    where: { postId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  const mediaCreate = media.length ? mapUploadMediaToCreateInput(media) : null;

  // Update the post
  return prisma.post.update({
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
}
