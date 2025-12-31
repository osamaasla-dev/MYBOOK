import type { Logger } from "pino";
import { MediaType } from "@prisma/client";

import { deleteMediaAsset } from "@/features/parts/media/utils/assetLifecycle";
import type { CreatePostMediaInput } from "../../schemas";

type PostMediaRecord = {
  publicId: string | null;
  type: MediaType;
};

type UploadedMediaRecord = Pick<CreatePostMediaInput, "publicId" | "type">;

type CleanupContext = {
  postId?: string;
  reason: string;
};

function resolveResourceType(
  mediaType: MediaType | UploadedMediaRecord["type"]
): "image" | "video" {
  if (
    mediaType === MediaType.VIDEO ||
    (typeof mediaType === "string" && mediaType.toLowerCase() === "video")
  ) {
    return "video";
  }

  return "image";
}

async function deleteAssets(
  targets: { publicId: string; resourceType: "image" | "video" }[],
  log: Logger,
  context: CleanupContext
) {
  if (!targets.length) return;

  const results = await Promise.allSettled(
    targets.map((target) =>
      deleteMediaAsset(target.publicId, target.resourceType)
    )
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      log.error(
        {
          error: result.reason,
          publicId: targets[index]?.publicId,
          postId: context.postId,
          reason: context.reason,
        },
        "Failed to delete Cloudinary asset"
      );
    }
  });
}

export async function deletePostMediaAssets(
  mediaRecords: PostMediaRecord[],
  log: Logger,
  context: CleanupContext
) {
  const targets = mediaRecords
    .filter((record): record is Required<PostMediaRecord> =>
      Boolean(record.publicId)
    )
    .map((record) => ({
      publicId: record.publicId!,
      resourceType: resolveResourceType(record.type),
    }));

  await deleteAssets(targets, log, context);
}

type MediaPayloadLike = {
  id?: string | null;
  publicId?: string | null;
  type?: string | null;
};

export function extractUploadedMediaCandidates(
  payload: unknown
): UploadedMediaRecord[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const media = (payload as { media?: unknown }).media;
  if (!Array.isArray(media)) {
    return [];
  }

  return media
    .filter(
      (item): item is MediaPayloadLike =>
        Boolean(item) && typeof item === "object"
    )
    .filter((item) => !item.id && typeof item.publicId === "string")
    .map((item) => {
      const typeText =
        typeof item.type === "string" ? item.type.toLowerCase() : "image";
      const normalizedType: UploadedMediaRecord["type"] =
        typeText === "video" ? "video" : "image";
      return {
        publicId: item.publicId as string,
        type: normalizedType,
      };
    });
}

export async function deleteUploadedMediaInputs(
  mediaInputs: UploadedMediaRecord[],
  log: Logger,
  context: CleanupContext
) {
  const seen = new Set<string>();
  const targets = mediaInputs
    .filter(
      (
        record
      ): record is { publicId: string; type: UploadedMediaRecord["type"] } =>
        Boolean(record.publicId)
    )
    .filter((record) => {
      if (seen.has(record.publicId)) return false;
      seen.add(record.publicId);
      return true;
    })
    .map((record) => ({
      publicId: record.publicId,
      resourceType: resolveResourceType(record.type),
    }));

  await deleteAssets(targets, log, context);
}
