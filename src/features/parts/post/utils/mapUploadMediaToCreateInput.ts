import { MediaType, type Prisma } from "@prisma/client";

import type { CreatePostMediaInput } from "../schemas/createPostSchema";

function normalizeDuration(duration?: number | null) {
  if (typeof duration !== "number" || Number.isNaN(duration)) {
    return null;
  }
  const rounded = Math.round(duration);
  return rounded >= 0 ? rounded : null;
}

export function mapUploadMediaToCreateInput(
  media: CreatePostMediaInput[]
): Prisma.MediaCreateWithoutPostInput[] {
  return media.map((item) => ({
    url: item.url,
    publicId: item.publicId,
    type: item.type === "video" ? MediaType.VIDEO : MediaType.IMAGE,
    width: typeof item.width === "number" ? item.width : null,
    height: typeof item.height === "number" ? item.height : null,
    duration: normalizeDuration(item.duration),
  }));
}
