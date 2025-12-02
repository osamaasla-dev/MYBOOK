import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { PostVisibility, PostVisibilityPreference } from "@prisma/client";

import type { ComposerActionItem } from "../ActionsRow";
import { useAutosizeTextarea } from "./useAutosizeTextarea";
import { useMediaPreview } from "./useMediaPreview";

type UsePostComposerStateOptions = {
  isOpen: boolean;
};

export function usePostComposerState({ isOpen }: UsePostComposerStateOptions) {
  const [contentValue, setContentValue] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>(
    PostVisibility.PUBLIC
  );
  const [visibilityPreference, setVisibilityPreference] =
    useState<PostVisibilityPreference>(
      PostVisibilityPreference.ACCOUNT_DEFAULT
    );

  const editorRef = useAutosizeTextarea(contentValue);
  const { mediaPreviews, appendMedia, removeMedia, clearMedia } =
    useMediaPreview({ isOpen });

  const actionItems = useMemo<ComposerActionItem[]>(
    () => [
      {
        icon: ImageIcon,
        label: "Image / Video",
        iconClassName: "text-blue-500",
        badgeClassName: "bg-blue-50 text-blue-600 border border-blue-100",
        inputAccept: "image/*,video/*",
        inputId: "composer-media-input",
      },
    ],
    []
  );

  const trimmedContent = contentValue.trim();
  const canPublish = trimmedContent.length > 0 || mediaPreviews.length > 0;

  return {
    contentValue,
    setContentValue,
    statusMessage,
    setStatusMessage,
    editorRef,
    mediaPreviews,
    appendMedia,
    removeMedia,
    clearMedia,
    actionItems,
    trimmedContent,
    canPublish,
    visibility,
    visibilityPreference,
    setVisibility,
    setVisibilityPreference,
  };
}
