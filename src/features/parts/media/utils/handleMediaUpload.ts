import type { Logger } from "pino";
import type { UploadApiResponse } from "cloudinary";

import { MediaUploadError } from "./errors";
import type { SessionLike } from "../types/media";
import { parseUploadInputs } from "./parseUploadInputs";
import { getFileBuffer } from "./getFileBuffer";
import { uploadToCloudinary } from "./uploadToCloudinary";
import { buildMetadata } from "./buildMetadata";
import { evaluateModeration } from "./evaluateModeration";
import { promoteMedia, removePendingAsset } from "./assetLifecycle";

type HandleMediaUploadParams = {
  req: Request;
  session: SessionLike;
  log: Logger;
};

export async function handleMediaUpload({
  req,
  session,
  log,
}: HandleMediaUploadParams): Promise<UploadApiResponse> {
  const userId = session?.user?.id;
  if (!userId) {
    throw new MediaUploadError("unauthorized", 401);
  }

  const formData = await req.formData();
  const inputs = parseUploadInputs(formData, userId);
  const buffer = await getFileBuffer(inputs.file);
  const tempFolder = `${inputs.baseFolder}/pending/${inputs.folderType}`;

  log.info(
    {
      folderType: inputs.folderType,
      resourceType: inputs.resourceType,
      moderationContext: inputs.moderationContext,
    },
    "Parsed media upload inputs"
  );

  const uploadResult = await uploadToCloudinary({
    buffer,
    folder: tempFolder,
    resourceType: inputs.resourceType,
  });

  const metadata = buildMetadata(uploadResult, tempFolder);

  const decision = await evaluateModeration(metadata, inputs.moderationContext);

  if (decision.status === "reject") {
    await removePendingAsset(metadata.publicId, metadata.type);
    log.info(
      { metadata, decision },
      "Media rejected during moderation; asset removed"
    );
    throw new MediaUploadError("rejected", 400);
  }

  const promoted = await promoteMedia(metadata.publicId);
  log.info(
    { metadata: promoted, decision, userId },
    "Media upload moderated and promoted"
  );

  return promoted;
}
