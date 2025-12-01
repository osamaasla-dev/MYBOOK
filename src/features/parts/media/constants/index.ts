import type { MediaResourceType } from "../types/media";

export const VALID_RESOURCE_TYPES = new Set<MediaResourceType | string>([
  "image",
  "video",
  "auto",
]);
