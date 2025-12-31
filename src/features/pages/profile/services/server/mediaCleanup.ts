import type { Logger } from "pino";

import { deleteMediaAsset } from "@/features/parts/media/utils/assetLifecycle";

type MediaIdentifiers = {
  avatarPublicId: string | null;
  coverPublicId: string | null;
};

type CleanupParams = {
  currentMedia?: MediaIdentifiers | null;
  nextAvatarUrl?: string | null;
  nextAvatarPublicId?: string | null;
  nextCoverUrl?: string | null;
  nextCoverPublicId?: string | null;
  log: Logger;
};

export async function cleanupProfileMedia({
  currentMedia,
  nextAvatarUrl,
  nextAvatarPublicId,
  nextCoverUrl,
  nextCoverPublicId,
  log,
}: CleanupParams): Promise<void> {
  if (!currentMedia) return;

  const pendingDeletions: string[] = [];

  if (currentMedia.avatarPublicId) {
    const avatarRemoved = nextAvatarUrl === null;
    const avatarReplaced =
      nextAvatarPublicId && nextAvatarPublicId !== currentMedia.avatarPublicId;

    if (avatarRemoved || avatarReplaced) {
      pendingDeletions.push(currentMedia.avatarPublicId);
    }
  }

  if (currentMedia.coverPublicId) {
    const coverRemoved = nextCoverUrl === null;
    const coverReplaced =
      nextCoverPublicId && nextCoverPublicId !== currentMedia.coverPublicId;

    if (coverRemoved || coverReplaced) {
      pendingDeletions.push(currentMedia.coverPublicId);
    }
  }

  if (!pendingDeletions.length) return;

  const results = await Promise.allSettled(
    pendingDeletions.map((publicId) => deleteMediaAsset(publicId))
  );

  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      log.error(
        {
          publicId: pendingDeletions[idx],
          error: result.reason,
        },
        "Failed to delete Cloudinary asset during profile update"
      );
    }
  });
}

export function extractUploadedProfileMedia(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const maybeString = (value: unknown) =>
    typeof value === "string" && value.trim().length ? value : null;

  const avatarPublicId = maybeString(
    (payload as { avatarPublicId?: unknown }).avatarPublicId
  );
  const coverPublicId = maybeString(
    (payload as { coverPublicId?: unknown }).coverPublicId
  );

  return [avatarPublicId, coverPublicId].filter((value): value is string =>
    Boolean(value)
  );
}

type DeleteUploadedProfileMediaContext = {
  reason: string;
};

export async function deleteUploadedProfileMedia(
  publicIds: string[],
  log: Logger,
  context: DeleteUploadedProfileMediaContext
) {
  const uniquePublicIds = Array.from(new Set(publicIds));
  if (!uniquePublicIds.length) {
    return;
  }

  const results = await Promise.allSettled(
    uniquePublicIds.map((publicId) => deleteMediaAsset(publicId))
  );

  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      log.error(
        {
          publicId: uniquePublicIds[idx],
          error: result.reason,
          reason: context.reason,
        },
        "Failed to delete Cloudinary asset after profile upload failure"
      );
    }
  });
}
