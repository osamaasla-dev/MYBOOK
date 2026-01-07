import { MediaUploadError } from "./errors";
import type { MediaUploadInputs, MediaResourceType } from "../types/media";
import { VALID_RESOURCE_TYPES } from "../constants";
import { ModerationContext } from "../../moderation/types/moderationTypes";

export function parseUploadInputs(
  formData: FormData,
  userId: string
): MediaUploadInputs {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new MediaUploadError("noFile", 400);
  }

  const folderInput = formData.get("folder");
  const folderTypeInput = formData.get("folderType");
  const resourceTypeInput = formData.get("resourceType");
  const moderationContextInput = formData.get("context");

  const folderType =
    typeof folderTypeInput === "string" && folderTypeInput.trim().length > 0
      ? folderTypeInput.trim()
      : "generic";

  const baseFolder =
    typeof folderInput === "string" && folderInput.trim().length > 0
      ? folderInput.trim()
      : `users/${userId}`;

  const resourceType = parseResourceType(resourceTypeInput);
  const moderationContext = parseModerationContext(moderationContextInput);

  return {
    file,
    resourceType,
    folderType,
    baseFolder,
    moderationContext,
  };
}

function parseResourceType(
  value: FormDataEntryValue | null
): MediaResourceType {
  if (typeof value === "string") {
    const sanitized = value.trim().toLowerCase();
    if (VALID_RESOURCE_TYPES.has(sanitized)) {
      return sanitized as MediaResourceType;
    }
  }
  return "auto";
}

function parseModerationContext(
  value: FormDataEntryValue | null
): ModerationContext {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim() as ModerationContext;
  }
  return "post";
}
