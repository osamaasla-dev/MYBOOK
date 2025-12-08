import type { Visibility, PostVisibilityPreference } from "@prisma/client";

import type { CreatePostMediaInput } from "@/features/parts/post/schemas/createPostSchema";

import type { CreatePostInput } from "@/features/parts/post/schemas";

type BuildPostPayloadParams = {
  content: string;
  media: CreatePostMediaInput[];
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
};

export function buildPostPayload({
  content,
  media,
  visibility,
  visibilityPreference,
}: BuildPostPayloadParams): CreatePostInput {
  return {
    content: content || undefined,
    media,
    visibility,
    visibilityPreference,
  };
}
