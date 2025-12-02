import type { CreatePostMediaInput } from "@/features/parts/post/schemas/createPostSchema";
import type {
  UploadMediaResponse,
  UploadMediaVariables,
} from "@/features/parts/media/types/media";

import type { MediaPreview } from "../../useMediaPreview";
import { postMessages } from "@/lib/messages";

type UploadAllMediaParams = {
  mediaPreviews: MediaPreview[];
  mutateAsync: (
    variables: UploadMediaVariables
  ) => Promise<UploadMediaResponse>;
};

export async function uploadAllMedia({
  mediaPreviews,
  mutateAsync,
}: UploadAllMediaParams): Promise<CreatePostMediaInput[]> {
  if (!mediaPreviews.length) {
    return [];
  }

  const uploadedMedia: CreatePostMediaInput[] = [];

  for (const preview of mediaPreviews) {
    const response = await mutateAsync({
      file: preview.file,
      folderType: "posts",
      context: "post",
    });

    if (response.moderationStatus === "reject") {
      throw new Error(postMessages.PUBLISHING_MESSAGES.mediaRejected);
    }

    const asset = response.asset;
    if (!asset) {
      throw new Error(postMessages.PUBLISHING_MESSAGES.mediaMissingAsset);
    }

    uploadedMedia.push({
      url: asset.url,
      publicId: asset.publicId,
      folder: asset.folder,
      format: asset.format,
      type: asset.type === "video" ? "video" : "image",
      width: asset.width ?? null,
      height: asset.height ?? null,
      duration: asset.duration ?? null,
      frames: asset.frames ?? null,
      frameRate: asset.frameRate ?? null,
    });
  }

  return uploadedMedia;
}
