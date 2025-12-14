import type { CreatePostInput } from "../../schemas";
import { mapUploadMediaToCreateInput } from "../../utils";
import { prisma } from "@/lib/prisma";

export type CreatePostParams = {
  authorId: string;
  input: CreatePostInput;
};

export async function createPost({ authorId, input }: CreatePostParams) {
  const { content = null, visibility, visibilityPreference, media } = input;
  const mediaCreate = media.length ? mapUploadMediaToCreateInput(media) : null;

  return prisma.post.create({
    data: {
      authorId,
      content,
      visibility,
      visibilityPreference,
      media: mediaCreate ? { create: mediaCreate } : undefined,
    },
    include: {
      media: true,
    },
  });
}
