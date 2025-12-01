import type { UploadApiResponse } from "cloudinary";

import cloudinary from "@/lib/cloudinary";
import type { MediaResourceType } from "../types/media";

export async function uploadToCloudinary({
  buffer,
  folder,
  resourceType,
}: {
  buffer: Buffer;
  folder: string;
  resourceType: MediaResourceType;
}): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: resourceType, transformation: [] },
        (error, result) => {
          if (error) return reject(error);
          if (!result) {
            return reject(new Error("Cloudinary upload returned no result"));
          }
          resolve(result);
        }
      )
      .end(buffer);
  });
}
