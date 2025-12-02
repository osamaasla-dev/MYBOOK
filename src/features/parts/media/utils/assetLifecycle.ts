import type { UploadApiResponse } from "cloudinary";

import cloudinary from "@/lib/cloudinary";

export async function removePendingAsset(
  publicId: string,
  resourceType: string
) {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

export function promoteMedia(publicId: string): Promise<UploadApiResponse> {
  return cloudinary.uploader.rename(publicId, publicId.replace("/pending", ""));
}
