import type { UploadApiResponse } from "cloudinary";

import cloudinary from "@/lib/cloudinary";

export async function deleteMediaAsset(
  publicId: string,
  resourceType: string = "image"
) {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

export async function removePendingAsset(
  publicId: string,
  resourceType: string
) {
  await deleteMediaAsset(publicId, resourceType);
}

export function promoteMedia(publicId: string): Promise<UploadApiResponse> {
  return cloudinary.uploader.rename(publicId, publicId.replace("/pending", ""));
}
