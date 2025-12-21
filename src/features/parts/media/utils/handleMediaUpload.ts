import type { Logger } from "pino";

import { MediaUploadError } from "./errors";
import type {
  MediaAssetPayload,
  SessionLike,
  UploadMediaResponse,
} from "../types/media";
import { parseUploadInputs } from "./parseUploadInputs";
import { getFileBuffer } from "./getFileBuffer";
import { uploadToCloudinary } from "./uploadToCloudinary";
import { buildMetadata } from "./buildMetadata";
import { evaluateModeration } from "./evaluateModeration";
import { promoteMedia, removePendingAsset } from "./assetLifecycle";
import moderationMessages from "@/lib/messages/moderation";

type HandleMediaUploadParams = {
  req: Request;
  session: SessionLike;
  log: Logger;
};

export async function handleMediaUpload({
  req,
  session,
  log,
}: HandleMediaUploadParams): Promise<UploadMediaResponse> {
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
    throw new MediaUploadError("rejected", 422, {
      message: moderationMessages.mediaBlocked,
      details: { metadata, decision },
    });
  }

  const promoted = await promoteMedia(metadata.publicId);
  log.info(
    { metadata: promoted, decision, userId },
    "Media upload moderated and promoted"
  );

  const asset: MediaAssetPayload = {
    url: promoted.secure_url,
    publicId: promoted.public_id,
    width: promoted.width,
    height: promoted.height,
    format: promoted.format,
    folder: promoted.folder ?? metadata.folder.replace("/pending", ""),
    type: promoted.resource_type,
    duration: promoted.duration ?? metadata.duration ?? null,
    frames: promoted.nb_frames ?? metadata.frames ?? null,
    frameRate: promoted.frame_rate ?? metadata.frameRate ?? null,
  };

  return {
    moderationSeverity: decision.severity,
    moderationContext: decision.context,
    moderationThreshold: decision.threshold,
    moderationStatus: decision.status,
    asset,
  };
}
