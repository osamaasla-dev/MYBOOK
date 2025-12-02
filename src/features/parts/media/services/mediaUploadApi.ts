import { apiPostR } from "@/lib/api";
import { UploadMediaResponse, UploadMediaVariables } from "../types/media";

const MEDIA_UPLOAD_ENDPOINT = "/media/upload";

export async function uploadMedia({
  file,
  folder,
  folderType,
  resourceType,
  context,
}: UploadMediaVariables): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (folder) formData.append("folder", folder);
  if (folderType) formData.append("folderType", folderType);
  if (resourceType) formData.append("resourceType", resourceType);
  if (context) formData.append("context", context);

  const { data } = await apiPostR<UploadMediaResponse>(
    MEDIA_UPLOAD_ENDPOINT,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
    }
  );

  return data;
}
