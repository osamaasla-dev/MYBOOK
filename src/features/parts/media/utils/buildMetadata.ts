import type { UploadApiResponse } from "cloudinary";

import type { MediaMetadata } from "../types/media";

export function buildMetadata(
  result: UploadApiResponse,
  folder: string
): MediaMetadata {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    folder,
    type: result.resource_type,
    duration: result.duration ?? null,
    frames: result.nb_frames ?? null,
    frameRate: result.frame_rate ?? null,
  };
}
