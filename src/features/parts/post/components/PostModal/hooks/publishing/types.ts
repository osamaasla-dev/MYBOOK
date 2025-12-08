import type { Visibility, PostVisibilityPreference } from "@prisma/client";

import type { MediaPreview } from "../useMediaPreview";

export type UsePostPublishingOptions = {
  trimmedContent: string;
  mediaPreviews: MediaPreview[];
  clearMedia: () => void;
  setStatusMessage: (message: string | null) => void;
  onClose: () => void;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  resetDraft: () => void;
};

export type PublishArgs = {
  canPublish: boolean;
};

export type PublishProgress = {
  value: number;
  label: string;
};
