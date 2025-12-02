import type { PostVisibility, PostVisibilityPreference } from "@prisma/client";

import type { MediaPreview } from "../useMediaPreview";

export type UsePostPublishingOptions = {
  trimmedContent: string;
  mediaPreviews: MediaPreview[];
  clearMedia: () => void;
  setStatusMessage: (message: string | null) => void;
  setContentValue: (value: string) => void;
  onClose: () => void;
  visibility: PostVisibility;
  visibilityPreference: PostVisibilityPreference;
};

export type PublishArgs = {
  canPublish: boolean;
};
